import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Camera, CameraView, useCameraPermissions } from "expo-camera";
import { Asset } from "expo-asset";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

type PermissionState = "undetermined" | "granted" | "denied";
type ModelStatus = "Loading..." | "Ready" | "Failed" | "Dev Build Required";

export default function MonitoringScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, setMicrophonePermission] =
    useState<PermissionState>("undetermined");
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(true);
  const [modelStatus, setModelStatus] = useState<ModelStatus>("Loading...");
  const modelSessionRef = useRef<unknown | null>(null);

  const loadModel = useCallback(async () => {
    try {
      const isExpoGo = Constants.appOwnership === "expo";
      if (isExpoGo) {
        setModelStatus("Dev Build Required");
        console.warn(
          "[ONNX] onnxruntime-react-native requires a development build and is not supported in Expo Go.",
        );
        return;
      }

      setModelStatus("Loading...");

      // Path is relative to app/monitoring.tsx.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const modelAssetModule = require("../assets/models/vigilant_driver_model.onnx");
      const asset = Asset.fromModule(modelAssetModule);

      await asset.downloadAsync();

      if (!asset.localUri) {
        throw new Error("Model asset local URI is unavailable.");
      }

      const ort = await import("onnxruntime-react-native");
      const session = await ort.InferenceSession.create(asset.localUri);
      modelSessionRef.current = session;
      setModelStatus("Ready");
      console.log("[ONNX] Model loaded successfully:", asset.localUri);
    } catch (error) {
      console.error("[ONNX] Model load failed:", error);
      setModelStatus("Failed");
    }
  }, []);

  const requestAllPermissions = useCallback(async () => {
    setIsRequestingPermissions(true);

    try {
      let cameraGranted = !!cameraPermission?.granted;

      if (!cameraGranted) {
        const camResult = await requestCameraPermission();
        cameraGranted = !!camResult.granted;
      }

      const micResult = await Camera.requestMicrophonePermissionsAsync();
      setMicrophonePermission(micResult.granted ? "granted" : "denied");

      // Keep camera state local so the denied view can render instantly.
      if (!cameraGranted && cameraPermission?.granted) {
        cameraGranted = false;
      }
    } catch (error) {
      console.error("Failed to request permissions:", error);
      setMicrophonePermission("denied");
    } finally {
      setIsRequestingPermissions(false);
    }
  }, [cameraPermission?.granted, requestCameraPermission]);

  useEffect(() => {
    void requestAllPermissions();
  }, [requestAllPermissions]);

  useEffect(() => {
    void loadModel();
  }, [loadModel]);

  const handleStopMonitoring = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/(tabs)");
  };

  const cameraGranted = !!cameraPermission?.granted;
  const micGranted = microphonePermission === "granted";

  if (
    isRequestingPermissions &&
    (!cameraPermission || microphonePermission === "undetermined")
  ) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>
          Requesting camera and microphone access...
        </Text>
      </SafeAreaView>
    );
  }

  if (!cameraGranted || !micGranted) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <View style={styles.permissionCard}>
          <Ionicons name="videocam-outline" size={64} color="#FF8A00" />
          <Text style={styles.permissionTitle}>Permissions Required</Text>
          <Text style={styles.permissionText}>
            Camera and microphone access are required to start live monitoring.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              void requestAllPermissions();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Grant Permissions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleStopMonitoring}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="front" />

      <SafeAreaView style={styles.overlayContainer} pointerEvents="box-none">
        <View style={styles.topOverlay}>
          <Text style={styles.modelStatusText}>AI Model: {modelStatus}</Text>
        </View>

        <View style={styles.bottomOverlay}>
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStopMonitoring}
            activeOpacity={0.85}
          >
            <Ionicons name="stop-circle" size={26} color="#FFFFFF" />
            <Text style={styles.stopButtonText}>Stop Monitoring</Text>
          </TouchableOpacity>
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
  camera: {
    flex: 1,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  topOverlay: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modelStatusText: {
    alignSelf: "flex-start",
    color: "#FFFFFF",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    fontSize: 14,
    fontWeight: "700",
  },
  bottomOverlay: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stopButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: "rgba(213, 33, 49, 0.95)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  stopButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  centerScreen: {
    flex: 1,
    backgroundColor: "#101216",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 14,
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
  },
  permissionCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    padding: 22,
    backgroundColor: "#1A1F28",
    alignItems: "center",
  },
  permissionTitle: {
    marginTop: 12,
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },
  permissionText: {
    marginTop: 10,
    color: "#C9D2E3",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  primaryButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#2E6CF6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    width: "100%",
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3A4558",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#D6E0F0",
    fontSize: 15,
    fontWeight: "600",
  },
});
