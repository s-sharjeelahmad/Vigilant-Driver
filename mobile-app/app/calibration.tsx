import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FaceDetector from "expo-face-detector";
import * as FileSystem from "expo-file-system/legacy";

import Constants from "expo-constants";
import { ensureModelExists } from "../src/services/modelFileService";
import { useSession } from "@/src/context/SessionContext";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import ActionButton from "@/src/components/common/ActionButton";
import { useTheme } from "@/src/context/ThemeContext";
import {
  BorderRadius,
  FontSizes,
  FontWeights,
  Shadow,
  Spacing,
} from "@/src/utils/constants";

type CalibrationState = "NO_FACE" | "ALIGNING" | "HOLD" | "READY";

type DetectedFace = {
  bounds: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
};

const SAFE_ZONE_WIDTH_RATIO = 0.35;
const SAFE_ZONE_HEIGHT_RATIO = 0.45;
const HOLD_DURATION_MS = 3000;
const DETECTION_INTERVAL_MS = 500;

export default function CalibrationScreen() {
  const { colors, fontSize } = useTheme();
  const isFocused = useIsFocused();
  const { autoStart } = useLocalSearchParams<{ autoStart?: string }>();
  const shouldAutoStart = autoStart === "1" || autoStart === "true";

  const [permission, requestPermission] = useCameraPermissions();
  const hasPermission = permission?.granted ?? false;
  const [isRequestingPermission, setIsRequestingPermission] = useState(true);
  const [previewLayout, setPreviewLayout] = useState({ width: 0, height: 0 });
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [calibrationState, setCalibrationState] =
    useState<CalibrationState>("NO_FACE");
  const [countdown, setCountdown] = useState(3);

  const cameraRef = useRef<any>(null);
  const holdStartRef = useRef<number | null>(null);
  const stateRef = useRef<CalibrationState>("NO_FACE");
  const readyHapticRef = useRef(false);
  const permissionRequestedRef = useRef(false);
  const isDetectingRef = useRef(false);

  const getFontSize = useCallback(
    (base: number) => {
      const multiplier =
        fontSize === "small" ? 0.9 : fontSize === "large" ? 1.1 : 1;
      return base * multiplier;
    },
    [fontSize],
  );

  const setStateIfChanged = useCallback((nextState: CalibrationState) => {
    if (stateRef.current !== nextState) {
      stateRef.current = nextState;
      setCalibrationState(nextState);
    }
  }, []);

  const setCountdownIfChanged = useCallback((nextCountdown: number) => {
    setCountdown((prev) => (prev === nextCountdown ? prev : nextCountdown));
  }, []);

  const resetHold = useCallback(() => {
    holdStartRef.current = null;
    readyHapticRef.current = false;
    setCountdownIfChanged(3);
  }, [setCountdownIfChanged]);

  const triggerSuccessHaptic = useCallback(() => {
    if (readyHapticRef.current) {
      return;
    }

    readyHapticRef.current = true;
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success,
    ).catch((error: unknown) => {
      console.warn("[Calibration] Haptics failed:", error);
    });
  }, []);

  const handleDetection = useCallback(
    (hasFace: boolean, isCentered: boolean) => {
      if (!hasFace) {
        resetHold();
        setStateIfChanged("NO_FACE");
        return;
      }

      if (!isCentered) {
        resetHold();
        setStateIfChanged("ALIGNING");
        return;
      }

      const now = Date.now();
      if (!holdStartRef.current) {
        holdStartRef.current = now;
      }

      const elapsed = now - holdStartRef.current;
      if (elapsed >= HOLD_DURATION_MS) {
        setCountdownIfChanged(0);
        setStateIfChanged("READY");
        triggerSuccessHaptic();
        return;
      }

      const remainingSeconds = Math.ceil((HOLD_DURATION_MS - elapsed) / 1000);
      setCountdownIfChanged(remainingSeconds);
      setStateIfChanged("HOLD");
    },
    [resetHold, setCountdownIfChanged, setStateIfChanged, triggerSuccessHaptic],
  );

  const safeZone = useMemo(() => {
    if (!previewLayout.width || !previewLayout.height) {
      return null;
    }

    const width = previewLayout.width * SAFE_ZONE_WIDTH_RATIO;
    const height = previewLayout.height * SAFE_ZONE_HEIGHT_RATIO;
    const left = (previewLayout.width - width) / 2;
    const top = (previewLayout.height - height) / 2;

    return {
      width,
      height,
      left,
      top,
      right: left + width,
      bottom: top + height,
    };
  }, [previewLayout.height, previewLayout.width]);

  const evaluateDetectedFaces = useCallback(
    (faces: DetectedFace[], imageWidth: number, imageHeight: number) => {
      if (faces.length === 0) {
        handleDetection(false, false);
        return;
      }

      let largestFace = faces[0];
      let largestArea =
        faces[0].bounds.size.width * faces[0].bounds.size.height;

      for (let i = 1; i < faces.length; i += 1) {
        const face = faces[i];
        const area = face.bounds.size.width * face.bounds.size.height;
        if (area > largestArea) {
          largestFace = face;
          largestArea = area;
        }
      }

      const bounds = largestFace.bounds;
      const centerX = bounds.origin.x + bounds.size.width / 2;
      const centerY = bounds.origin.y + bounds.size.height / 2;

      const safeWidth = imageWidth * SAFE_ZONE_WIDTH_RATIO;
      const safeHeight = imageHeight * SAFE_ZONE_HEIGHT_RATIO;
      const safeLeft = (imageWidth - safeWidth) / 2;
      const safeTop = (imageHeight - safeHeight) / 2;

      const isCentered =
        centerX >= safeLeft &&
        centerX <= safeLeft + safeWidth &&
        centerY >= safeTop &&
        centerY <= safeTop + safeHeight;

      handleDetection(true, isCentered);
    },
    [handleDetection],
  );

  const faceDetectorOptions = useMemo(
    () => ({
      mode: FaceDetector.FaceDetectorMode.fast,
      detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
      runClassifications: FaceDetector.FaceDetectorClassifications.none,
      tracking: false,
    }),
    [],
  );

  const runFaceDetection = useCallback(async () => {
    if (
      isDetectingRef.current ||
      !cameraRef.current ||
      !isFocused ||
      !hasPermission ||
      !isCameraReady
    ) {
      return;
    }

    isDetectingRef.current = true;
    let photoUri: string | undefined;

    try {
      if (!cameraRef.current || !isCameraReady) {
        isDetectingRef.current = false;
        return;
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.25,
        skipProcessing: true,
      });

      photoUri = photo?.uri;
      if (!photoUri || !photo?.width || !photo?.height) {
        handleDetection(false, false);
        return;
      }

      const result = await FaceDetector.detectFacesAsync(
        photoUri,
        faceDetectorOptions,
      );

      const faces = (result?.faces ?? []) as DetectedFace[];
      evaluateDetectedFaces(faces, photo.width, photo.height);
    } catch (error: any) {
      // Common error: "Failed to capture image" if called too fast
      if (error.message?.includes("capture")) {
        console.log("[Calibration] Capture busy, skipping frame...");
      } else {
        console.warn("[Calibration] Face detection failed:", error);
      }
    } finally {
      if (photoUri) {
        void FileSystem.deleteAsync(photoUri, { idempotent: true });
      }
      isDetectingRef.current = false;
    }
  }, [
    evaluateDetectedFaces,
    faceDetectorOptions,
    handleDetection,
    hasPermission,
    isCameraReady,
    isFocused,
  ]);

  const readyTriggeredRef = useRef(false);

  useEffect(() => {
    if (!shouldAutoStart) {
      return;
    }
    if (calibrationState === "READY" && !readyTriggeredRef.current) {
      readyTriggeredRef.current = true;
      // Navigation only — startSession() is called by monitoring.tsx
      void router.push("/monitoring");
    }
  }, [calibrationState, shouldAutoStart]);

  // Preload ONNX artifacts while calibrating to reduce cold-start in monitoring
  useEffect(() => {
    let mounted = true;
    const preload = async () => {
      try {
        const isExpoGo = Constants.appOwnership === "expo";
        if (isExpoGo) return;
        if (!mounted) return;
        await ensureModelExists();
        if (!mounted) return;
        // Importing the runtime warms native bindings earlier
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        import("onnxruntime-react-native").catch((e) => {
          console.warn("[Calibration] ORT import failed during preload:", e);
        });
        console.log("[Calibration] ONNX preload triggered");
      } catch (err) {
        console.warn("[Calibration] ONNX preload error:", err);
      }
    };

    void preload();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!permission) {
      return;
    }

    if (permission.granted) {
      setIsRequestingPermission(false);
      return;
    }

    if (permissionRequestedRef.current) {
      setIsRequestingPermission(false);
      return;
    }

    permissionRequestedRef.current = true;
    setIsRequestingPermission(true);
    void requestPermission().finally(() => {
      setIsRequestingPermission(false);
    });
  }, [permission, requestPermission]);

  useEffect(() => {
    if (!isFocused) {
      resetHold();
      setStateIfChanged("NO_FACE");
    }
  }, [isFocused, resetHold, setStateIfChanged]);

  useEffect(() => {
    if (!isFocused || !hasPermission || !isCameraReady) {
      return;
    }

    const intervalId = setInterval(() => {
      void runFaceDetection();
    }, DETECTION_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [hasPermission, isCameraReady, isFocused, runFaceDetection]);

  const handlePreviewLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setPreviewLayout({ width, height });
  }, []);

  const safeZoneStyle = safeZone
    ? {
        width: safeZone.width,
        height: safeZone.height,
        left: safeZone.left,
        top: safeZone.top,
      }
    : null;

  const indicatorColor = useMemo(() => {
    switch (calibrationState) {
      case "NO_FACE":
        return colors.error;
      case "ALIGNING":
        return colors.warning;
      case "HOLD":
        return colors.info;
      case "READY":
        return colors.success;
      default:
        return colors.textLight;
    }
  }, [calibrationState, colors]);

  const statusText = useMemo(() => {
    switch (calibrationState) {
      case "NO_FACE":
        return "No face detected";
      case "ALIGNING":
        return "Align your face inside the box";
      case "HOLD":
        return "Hold still";
      case "READY":
        return "Calibration complete";
      default:
        return "";
    }
  }, [calibrationState]);

  if (!permission || (isRequestingPermission && !hasPermission)) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Requesting camera access...</Text>
      </SafeAreaView>
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <View style={styles.permissionCard}>
          <Ionicons name="videocam-outline" size={64} color={colors.warning} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Enable the camera to calibrate the phone position before monitoring.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              void requestPermission();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              router.replace("/(tabs)");
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container} onLayout={handlePreviewLayout}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="front"
        ref={cameraRef}
        onCameraReady={() => {
          setIsCameraReady(true);
        }}
      />

      {safeZoneStyle && (
        <View
          pointerEvents="none"
          style={[
            styles.safeZone,
            safeZoneStyle,
            { borderColor: indicatorColor },
          ]}
        />
      )}

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topPanel}>
          <View style={styles.statusPill}>
            <View
              style={[styles.statusDot, { backgroundColor: indicatorColor }]}
            />
            <Text style={[styles.statusText, { color: colors.text }]}>
              {statusText}
            </Text>
          </View>

          <Text style={[styles.helperText, { color: colors.textLight }]}>
            Keep your face centered for 3 seconds
          </Text>
        </View>

        <View style={styles.centerPanel} pointerEvents="none">
          {calibrationState === "HOLD" && (
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          )}
          {calibrationState === "READY" && (
            <View style={styles.readyBadge}>
              <Ionicons name="checkmark-circle" size={32} color="#FFFFFF" />
              <Text style={styles.readyText}>READY</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomPanel}>
          <ActionButton
            title="Start Monitoring Session"
            icon="play-circle"
            onPress={() => {
              // Navigation is handled automatically by the READY useEffect above.
              // This button is a visual indicator only when calibration succeeds.
            }}
            disabled={calibrationState !== "READY"}
          />
          <Text
            style={[
              styles.previewNote,
              { color: colors.textLight, fontSize: getFontSize(FontSizes.xs) },
            ]}
          >
            Calibration runs in low power mode to keep the device cool.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  safeZone: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    borderStyle: "dashed",
  },
  topPanel: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  statusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    gap: Spacing.sm,
    ...Shadow.small,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 14,
    fontWeight: FontWeights.semibold,
  },
  helperText: {
    marginTop: Spacing.sm,
    fontSize: 13,
  },
  centerPanel: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  countdownBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  countdownText: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: FontWeights.bold,
  },
  readyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(76, 175, 80, 0.9)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
  },
  readyText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.6,
  },
  bottomPanel: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  previewNote: {
    textAlign: "center",
  },
  centerScreen: {
    flex: 1,
    backgroundColor: "#101216",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.sm,
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
  },
  permissionCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    backgroundColor: "#1A1F28",
    alignItems: "center",
  },
  permissionTitle: {
    marginTop: Spacing.md,
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: FontWeights.bold,
    textAlign: "center",
  },
  permissionText: {
    marginTop: Spacing.sm,
    color: "#C9D2E3",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  primaryButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: "#2E6CF6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: FontWeights.bold,
  },
  secondaryButton: {
    width: "100%",
    minHeight: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#3A4558",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#D6E0F0",
    fontSize: 15,
    fontWeight: FontWeights.semibold,
  },
});
