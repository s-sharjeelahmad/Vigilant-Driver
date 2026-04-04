import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, CameraView, useCameraPermissions } from "expo-camera";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as tf from "@tensorflow/tfjs";
import { decodeJpeg } from "@tensorflow/tfjs-react-native";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSession } from "@/src/context/SessionContext";
import { sendDriverEvent } from "@/src/services/apiClient";
import { ensureModelExists } from "../src/services/modelFileService";
import type { DriverState } from "@/src/services/apiClient";

type PermissionState = "undetermined" | "granted" | "denied";
type ModelStatus = "Loading..." | "Ready" | "Failed" | "Dev Build Required";

type OrtModule = typeof import("onnxruntime-react-native");
type OrtSession = import("onnxruntime-react-native").InferenceSession;
type OrtTensor = import("onnxruntime-react-native").Tensor;

interface PredictionResult {
  state: DriverState;
  confidence: number;
}

const PROCESS_INTERVAL_MS = 2000;
const INPUT_IMAGE_SIZE = 224;
const CHANNEL_MEAN = [0.485, 0.456, 0.406] as const;
const CHANNEL_STD = [0.229, 0.224, 0.225] as const;

export default function MonitoringScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, setMicrophonePermission] =
    useState<PermissionState>("undetermined");
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(true);
  const [modelStatus, setModelStatus] = useState<ModelStatus>("Loading...");
  const [lastPrediction, setLastPrediction] = useState<PredictionResult | null>(
    null,
  );

  const cameraRef = useRef<any>(null);
  const modelSessionRef = useRef<OrtSession | null>(null);
  const ortModuleRef = useRef<OrtModule | null>(null);
  const isProcessingRef = useRef(false);
  const sessionInitRef = useRef(false);

  const { activeSession, startSession, endSession, addSessionEvent } =
    useSession();

  const preprocessFrameForMobileNetV3 = useCallback(
    async (imageUri: string, ort: OrtModule): Promise<OrtTensor> => {
      const resized = await manipulateAsync(
        imageUri,
        [{ resize: { width: INPUT_IMAGE_SIZE, height: INPUT_IMAGE_SIZE } }],
        {
          compress: 1,
          format: SaveFormat.JPEG,
          base64: true,
        },
      );

      if (!resized.base64) {
        throw new Error("Failed to read resized image as base64.");
      }

      const jpegBytes = tf.util.encodeString(resized.base64, "base64");
      const decodedTensor = decodeJpeg(jpegBytes, 3);

      const pixelData = decodedTensor.dataSync();
      const planeSize = INPUT_IMAGE_SIZE * INPUT_IMAGE_SIZE;
      const inputData = new Float32Array(1 * 3 * planeSize);
      const inv255 = 1 / 255;

      for (let i = 0; i < planeSize; i += 1) {
        const rgbOffset = i * 3;
        const r = pixelData[rgbOffset] * inv255;
        const g = pixelData[rgbOffset + 1] * inv255;
        const b = pixelData[rgbOffset + 2] * inv255;

        inputData[i] = (r - CHANNEL_MEAN[0]) / CHANNEL_STD[0];
        inputData[planeSize + i] = (g - CHANNEL_MEAN[1]) / CHANNEL_STD[1];
        inputData[planeSize * 2 + i] = (b - CHANNEL_MEAN[2]) / CHANNEL_STD[2];
      }

      decodedTensor.dispose();

      return new ort.Tensor("float32", inputData, [1, 3, 224, 224]);
    },
    [],
  );

  const mapModelOutputToState = useCallback(
    (outputData: ArrayLike<number>): PredictionResult => {
      if (!outputData || outputData.length === 0) {
        return { state: "ALERT", confidence: 0.5 };
      }

      const logits = Array.from(outputData, (value) => Number(value));
      const maxLogit = Math.max(...logits);
      const expValues = logits.map((logit) => Math.exp(logit - maxLogit));
      const expSum = expValues.reduce((sum, value) => sum + value, 0);
      const probabilities = expValues.map((value) => value / expSum);

      let maxIndex = 0;
      let maxValue = probabilities[0] ?? 0;

      for (let i = 1; i < probabilities.length; i += 1) {
        const value = probabilities[i] ?? 0;
        if (value > maxValue) {
          maxValue = value;
          maxIndex = i;
        }
      }

      const stateByIndex: Record<number, DriverState> = {
        0: "ALERT",
        1: "DROWSY",
        2: "DISTRACTED",
      };
      const state: DriverState = stateByIndex[maxIndex] ?? "ALERT";

      return {
        state,
        confidence: Math.max(0, Math.min(1, maxValue)),
      };
    },
    [],
  );

  const runInferenceCycle = useCallback(async () => {
    if (isProcessingRef.current) {
      return;
    }

    if (
      !modelSessionRef.current ||
      !ortModuleRef.current ||
      !activeSession?.id
    ) {
      return;
    }

    if (!cameraRef.current) {
      return;
    }

    isProcessingRef.current = true;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.35,
        skipProcessing: true,
      });

      if (!photo?.uri) {
        return;
      }

      const tensor = await preprocessFrameForMobileNetV3(
        photo.uri,
        ortModuleRef.current,
      );

      const session = modelSessionRef.current;
      const inputName = session.inputNames[0];
      const outputName = session.outputNames[0];

      const feeds: Record<string, OrtTensor> = {
        [inputName]: tensor,
      };

      const outputs = await session.run(feeds);
      const outputTensor = outputs[outputName] as { data: ArrayLike<number> };
      const prediction = mapModelOutputToState(outputTensor?.data || []);

      setLastPrediction(prediction);
      addSessionEvent(prediction.state, prediction.confidence);

      // TODO (Abrar): When the LSTM model is ready, replace this mock EAR/MAR/Headpose data with actual extracted features.
      void sendDriverEvent({
        session_id: activeSession.id,
        state: prediction.state,
        confidence: prediction.confidence,
        features: {
          ear: 0.3,
          mar: 0.1,
          headpose: { pitch: 0, yaw: 0, roll: 0 },
          model_version: "v1_mobilenet",
        },
      }).catch((error) => {
        console.error("[Monitoring] Failed to upload driver event:", error);
      });
    } catch (error) {
      console.error("[Monitoring] Inference cycle failed:", error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [
    activeSession?.id,
    addSessionEvent,
    mapModelOutputToState,
    preprocessFrameForMobileNetV3,
  ]);

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

      await tf.ready();

      setModelStatus("Loading...");
      const modelPath = await ensureModelExists();

      const ort = await import("onnxruntime-react-native");
      ortModuleRef.current = ort;

      const session = await ort.InferenceSession.create(modelPath);
      modelSessionRef.current = session;
      setModelStatus("Ready");
      console.log("[ONNX] Model loaded successfully:", modelPath);
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

  const initBackendSession = useCallback(async () => {
    if (sessionInitRef.current || activeSession?.id) {
      return;
    }

    sessionInitRef.current = true;

    try {
      await startSession();
    } catch (error: any) {
      sessionInitRef.current = false;
      Alert.alert(
        "Session Error",
        error?.message || "Failed to start backend monitoring session.",
      );
    }
  }, [activeSession?.id, startSession]);

  useEffect(() => {
    void requestAllPermissions();
  }, [requestAllPermissions]);

  useEffect(() => {
    void loadModel();
  }, [loadModel]);

  useEffect(() => {
    if (!!cameraPermission?.granted && microphonePermission === "granted") {
      void initBackendSession();
    }
  }, [cameraPermission?.granted, microphonePermission, initBackendSession]);

  useEffect(() => {
    const canProcess =
      modelStatus === "Ready" &&
      !!cameraPermission?.granted &&
      microphonePermission === "granted" &&
      !!activeSession?.id;

    if (!canProcess) {
      return;
    }

    const interval = setInterval(() => {
      void runInferenceCycle();
    }, PROCESS_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [
    activeSession?.id,
    cameraPermission?.granted,
    microphonePermission,
    modelStatus,
    runInferenceCycle,
  ]);

  const handleStopMonitoring = async () => {
    try {
      await endSession();
    } catch (error) {
      console.error("[Monitoring] Failed to end session cleanly:", error);
    }

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
            onPress={() => {
              void handleStopMonitoring();
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
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="front" />

      <SafeAreaView style={styles.overlayContainer} pointerEvents="box-none">
        <View style={styles.topOverlay}>
          <Text style={styles.modelStatusText}>AI Model: {modelStatus}</Text>
          <Text style={styles.predictionText}>
            {lastPrediction
              ? `Prediction: ${lastPrediction.state} (${Math.round(lastPrediction.confidence * 100)}%)`
              : "Prediction: waiting..."}
          </Text>
          <Text style={styles.sessionText}>
            Session: {activeSession?.id ? "Connected" : "Connecting..."}
          </Text>
        </View>

        <View style={styles.bottomOverlay}>
          <TouchableOpacity
            style={styles.stopButton}
            onPress={() => {
              void handleStopMonitoring();
            }}
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
    gap: 8,
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
  predictionText: {
    alignSelf: "flex-start",
    color: "#FFFFFF",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    fontSize: 14,
    fontWeight: "600",
  },
  sessionText: {
    alignSelf: "flex-start",
    color: "#E0E0E0",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    fontSize: 13,
    fontWeight: "600",
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
