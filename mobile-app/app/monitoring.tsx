import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  AppState,
  type AppStateStatus,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as FaceDetector from "expo-face-detector";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSession } from "@/src/context/SessionContext";
import { tokenManager } from "@/src/services/apiClient";
import {
  ensureModelExists,
  MODEL_VERSION,
} from "../src/services/modelFileService";
import type { DriverState } from "@/src/services/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────
type ModelStatus = "Loading..." | "Ready" | "Failed" | "Dev Build Required";
type OrtModule = typeof import("onnxruntime-react-native");
type OrtSession = import("onnxruntime-react-native").InferenceSession;

interface PredictionResult {
  state: DriverState;
  confidence: number;
}

interface FaceFeatures {
  /** Mapped to geometric EAR scale [~0.10–0.30]. Alert ~0.22–0.31. */
  ear: number;
  /** Mapped via smilingProbability: closed mouth ~0.95, yawn ~1.40. */
  mar: number;
  /** Dynamic pitch proxy oscillating around 175.0 (solvePnP convention). */
  pitch: number;
  /** Yaw in degrees, alert range ~-5 to +6. */
  yaw: number;
  /** Unwrapped roll in degrees, alert range ~-6 to +3. */
  roll: number;
  /** Whether a face was detected this frame. */
  face_detected: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const PROCESS_INTERVAL_MS = 100;
const PREDICTION_INTERVAL_MS = 100;
const ALERT_COOLDOWN_MS = 20000;
const FRAME_MULTIPLIER = 15;
const MODEL_LOG_INTERVAL_MS = 2000;
const DEBUG_MODEL_LOGS =
  (process.env.EXPO_PUBLIC_DEBUG_MODEL_LOGS ?? "0") === "1";
const DEBUG_MODEL_LOGS_EVERY_FRAME =
  (process.env.EXPO_PUBLIC_DEBUG_MODEL_LOGS_EVERY_FRAME ?? "0") === "1";

// ─── Screen dimensions (used for pitch proxy normalisation) ───────────────────
const SCREEN_HEIGHT = Dimensions.get("window").height;

// ---------------------------------------------------------
// 🧠 EDGE-AI INTEGRATION CONSTANTS (Trained May 2026)
// ---------------------------------------------------------
const SCALER_MEAN = [
  0.25343165247637717, // EAR
  0.987697737362876, // MAR
  -7.686670084321973, // pitch   (NOTE: solvePnP values ~±175 fold into this via modular arithmetic in training)
  22.251975119502415, // yaw
  34.397185855226894, // roll
  0.4404438643770396, // PERCLOS
  -0.0021575802517168957, // pitch_velocity
];
const SCALER_STD = [
  0.08166924333506154, // EAR
  0.11078806046559488, // MAR
  170.58535506037452, // pitch   (large std explains why ±175 maps cleanly)
  33.55884581093267, // yaw
  82.10658002240025, // roll
  0.44786412019505845, // PERCLOS
  19.287590969148663, // pitch_velocity
];

// ─── EAR Distribution Anchors ─────────────────────────────────────────────────
//
// MediaPipe 6-point geometric EAR:
//   Closed eye  → ~0.10–0.15
//   Drowsy      → ~0.15–0.20  (PERCLOS threshold)
//   Alert open  → ~0.22–0.31
//
// expo-face-detector eyeOpenProbability:
//   Closed      →  0.0–0.2
//   Half-open   →  0.2–0.5
//   Open        →  0.5–1.0
//
// Piecewise-linear map with four calibration anchors:
//   prob 0.00 → EAR 0.10  (fully closed)
//   prob 0.40 → EAR 0.10  (aggressive PERCLOS trigger for closed eyes)
//   prob 0.55 → EAR 0.22  (lower alert boundary)
//   prob 1.00 → EAR 0.30  (fully open)
//
// This ensures closed frames land below the 0.20 PERCLOS threshold
// and open frames sit inside the training alert distribution.
const EAR_ANCHORS: [number, number][] = [
  [0.0, 0.1],
  [0.4, 0.1],
  [0.55, 0.22],
  [1.0, 0.3],
];

/**
 * Piecewise-linear interpolation through EAR_ANCHORS.
 * Input:  eyeOpenProbability [0, 1]
 * Output: geometric EAR equivalent [0.10, 0.30]
 */
function mapProbToEAR(prob: number): number {
  const p = Math.max(0, Math.min(1, prob));
  for (let i = 0; i < EAR_ANCHORS.length - 1; i++) {
    const [x0, y0] = EAR_ANCHORS[i];
    const [x1, y1] = EAR_ANCHORS[i + 1];
    if (p <= x1) {
      const t = (p - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }
  return EAR_ANCHORS[EAR_ANCHORS.length - 1][1];
}

// ─── MAR Proxy via smilingProbability ─────────────────────────────────────────
//
// expo-face-detector mouth landmarks (bottomMouthPosition, leftMouthPosition,
// rightMouthPosition) are null on this device, so geometric MAR is unavailable.
//
// Fallback: use smilingProbability [0, 1] as a mouth-opening modulator.
//
// smilingProbability correlates with how wide the mouth is open — both genuine
// smiles and yawns drive it toward 1.0, making it the best available proxy
// for the drowsy-yawn signal the model was trained to detect.
//
// Linear interpolation between two calibrated anchors:
//   smilingProbability = 0.0  →  MAR = 0.95  (resting closed mouth, alert baseline)
//   smilingProbability = 1.0  →  MAR = 1.40  (wide open, yawn territory)
//
//   MAR = 0.95 + smilingProb × 0.45
//
// Z-score at resting baseline: (0.95 - 0.9877) / 0.1108 = -0.34 → within 1σ of mean.
// Z-score at full open:        (1.40 - 0.9877) / 0.1108 = +3.72 → strong drowsy signal.
//
// If smilingProbability is also null: fall back to MAR_ALERT_BASELINE (0.95).
const MAR_ALERT_BASELINE = 0.95;
const MAR_YAWN_MAX = 1.4;
const MAR_SMILE_RANGE = MAR_YAWN_MAX - MAR_ALERT_BASELINE; // 0.45

// ─── Pitch Proxy Constants ────────────────────────────────────────────────────
//
// Python solvePnP convention: looking straight ahead ≈ 175° or -175°.
// Head nodding downward (drowsy) causes pitch to drift toward 160° or 190°.
// This drift is what pitch_velocity captures for drowsiness detection.
//
// Strategy: use the normalised vertical position of the face bounding box
// top-left origin as a proxy for vertical head pose.
//
//   faceCentreY_norm = (bounds.origin.y + bounds.size.height / 2) / SCREEN_HEIGHT
//
// When a driver looks straight ahead, their face centre sits at roughly 35–55%
// of screen height (front-facing camera, driver seated). We capture this
// position on first valid detection as a "neutral anchor."
//
// Delta from anchor is scaled and added to the 175° baseline:
//   pitchProxy = PITCH_BASELINE + (faceCentreY_norm - anchorY_norm) * PITCH_SCALE
//
// PITCH_SCALE = 20.0: a 10% screen-height drift (~50px on 500px screen) → 2°
// change in pitch proxy. Dampened to prevent false DISTRACTED states from minor movement.
const PITCH_BASELINE = 175.0;
const PITCH_SCALE = 20.0;

// ─── Yaw Proxy Constants ──────────────────────────────────────────────────────
//
// Python training yaw range: alert ~-5 to +6 (degrees, MediaPipe/solvePnP).
// expo-face-detector gives noseBase.x offset from face centre (normalised -1..+1).
//
// The original normalised value lands in [-1, +1], but training expects [-5, +6].
// Scale factor: multiply normalised yaw by 8 to land in the training distribution.
// (A fully turned head at norm ±0.5 maps to ±4°, which is within the alert band.)
const YAW_SCALE = 8.0;

// ─── Roll Unwrap ──────────────────────────────────────────────────────────────
//
// expo-face-detector wraps roll to [0, 360).
// Python training expects signed roll ~[-6, +3] for alert drivers.
// Fix: if roll > 180, subtract 360 to get signed value.
// Then clamp to [-30, +30] to prevent outlier contamination.
function unwrapRoll(rawRoll: number): number {
  let r = rawRoll;
  if (r > 180) r -= 360;
  return Math.max(-30, Math.min(30, r));
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const computePerclos = (earHistory: number[]) => {
  // Threshold matches MediaPipe geometric EAR closed-eye boundary
  const PERCLOS_THRESHOLD = 0.2;
  const closedFrames = earHistory.filter(
    (ear) => ear < PERCLOS_THRESHOLD,
  ).length;
  return earHistory.length > 0 ? closedFrames / earHistory.length : 0;
};

const softmax = (values: number[]) => {
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp(v - max));
  const sum = exps.reduce((acc, v) => acc + v, 0) || 1;
  return exps.map((v) => v / sum);
};

// ─── Face Feature Extraction ──────────────────────────────────────────────────
/**
 * Extracts and maps face features to match the Python MediaPipe/solvePnP
 * training distribution. All outputs are in physical-scale units that
 * match the scaler the Bi-LSTM was trained with.
 *
 * Key proxy implementations:
 *   EAR   — piecewise-linear map from eyeOpenProbability → geometric EAR
 *   MAR   — smilingProbability modulates between closed-mouth (0.95) and yawn (1.40)
 *   Pitch — dynamic proxy anchored to first valid face position
 *   Yaw   — scaled nose-offset proxy
 *   Roll  — unwrapped signed degrees
 */
async function computeFaceFeatures(
  imageUri: string,
  pitchAnchorRef: React.MutableRefObject<number | null>,
): Promise<FaceFeatures> {
  const FALLBACK: FaceFeatures = {
    ear: 0.265, // Alert-range centre (above PERCLOS threshold)
    mar: MAR_ALERT_BASELINE, // Distribution centre — Z-score ≈ -0.34
    pitch: PITCH_BASELINE,
    yaw: 0,
    roll: 0,
    face_detected: false,
  };

  try {
    await delay(50); // Allow image flush before face detection
    const imageInfo = await FileSystem.getInfoAsync(imageUri);
    if (!imageInfo.exists || (imageInfo.size ?? 0) <= 0) return FALLBACK;

    const result = await FaceDetector.detectFacesAsync(imageUri, {
      mode: FaceDetector.FaceDetectorMode.fast,
      detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
      runClassifications: FaceDetector.FaceDetectorClassifications.all,
    });

    if (!result.faces || result.faces.length === 0) return FALLBACK;
    const face = result.faces[0] as any;

    // ── 1. EAR Proxy ──────────────────────────────────────────────────────────
    // Map eye-open probability through piecewise-linear anchors so the output
    // sits in the geometric EAR distribution the model was trained on.
    const leftProb: number = face.leftEyeOpenProbability ?? 0.9;
    const rightProb: number = face.rightEyeOpenProbability ?? 0.9;
    const avgProb = (leftProb + rightProb) / 2;
    const ear = mapProbToEAR(avgProb);

    // ── 2. MAR Proxy — smilingProbability modulator ───────────────────────────
    // Mouth landmarks are null on this device. smilingProbability is the best
    // available continuous signal for mouth-opening state (both smiles and yawns
    // drive it toward 1.0).
    //
    // Linear map:  MAR = MAR_ALERT_BASELINE + smilingProb × MAR_SMILE_RANGE
    //   prob 0.0  →  0.95  (resting closed mouth — alert baseline)
    //   prob 1.0  →  1.40  (wide open mouth — drowsy yawn signal)
    //
    // null probability → fall back to alert baseline (0.95), keeping the
    // feature in-distribution rather than creating a spurious signal.
    const smilingProb: number = face.smilingProbability ?? 0.0;
    const mar =
      MAR_ALERT_BASELINE +
      Math.max(0, Math.min(1, smilingProb)) * MAR_SMILE_RANGE;

    // ── 3. Roll Unwrap ────────────────────────────────────────────────────────
    // expo-face-detector wraps to [0, 360). A slight head tilt of -2° appears
    // as 358°. Unwrap to signed degrees to match training distribution.
    const rawRoll: number = face.rollAngle ?? 0;
    const roll = unwrapRoll(rawRoll);

    // ── 4. Pitch Dynamic Proxy ────────────────────────────────────────────────
    // Use face bounding box vertical centre as a head-pose proxy.
    // Anchor captured on first valid detection. Drift from anchor scales
    // pitch around the solvePnP baseline of 175°.
    const bounds = face.bounds as
      | {
          origin: { x: number; y: number };
          size: { width: number; height: number };
        }
      | undefined;

    let pitch = PITCH_BASELINE;
    if (bounds && SCREEN_HEIGHT > 0) {
      const faceCentreY = bounds.origin.y + bounds.size.height / 2;
      const faceCentreY_norm = faceCentreY / SCREEN_HEIGHT;

      // Capture neutral anchor on first valid face detection
      if (pitchAnchorRef.current === null) {
        pitchAnchorRef.current = faceCentreY_norm;
        if (DEBUG_MODEL_LOGS) {
          console.log(
            `[Pitch] Neutral anchor captured: ${faceCentreY_norm.toFixed(4)}`,
          );
        }
      }

      // Positive drift (face moves down screen) → head droops forward → pitch decreases
      // Negative drift (face moves up screen) → head tilts back → pitch increases
      const drift = pitchAnchorRef.current - faceCentreY_norm;
      pitch = PITCH_BASELINE + drift * PITCH_SCALE;
      // Clamp to physically plausible range around baseline
      pitch = Math.max(145, Math.min(205, pitch));
    }

    // ── 5. Yaw Proxy ──────────────────────────────────────────────────────────
    // Scale nose-offset normalised yaw into the training degree range.
    let yaw = 0;
    const nb = face.noseBasePosition;
    if (nb && bounds) {
      const faceCentreX = bounds.origin.x + bounds.size.width / 2;
      const normYaw = (nb.x - faceCentreX) / (bounds.size.width / 2);
      yaw = Math.max(-1, Math.min(1, normYaw)) * YAW_SCALE;
    }

    if (DEBUG_MODEL_LOGS) {
      console.log("[FaceFeatures] Proxies computed:", {
        leftProb: leftProb.toFixed(3),
        rightProb: rightProb.toFixed(3),
        avgProb: avgProb.toFixed(3),
        ear: ear.toFixed(4),
        smilingProb: smilingProb.toFixed(3),
        mar: mar.toFixed(4),
        pitch: pitch.toFixed(2),
        yaw: yaw.toFixed(3),
        roll: roll.toFixed(3),
        rawRoll: rawRoll.toFixed(1),
        pitchAnchor: pitchAnchorRef.current?.toFixed(4) ?? "none",
      });
    }

    return {
      ear: Number(ear.toFixed(4)),
      mar: Number(mar.toFixed(4)),
      pitch: Number(pitch.toFixed(2)),
      yaw: Number(yaw.toFixed(3)),
      roll: Number(roll.toFixed(3)),
      face_detected: true,
    };
  } catch (err) {
    console.warn("[FaceFeatures] Detection failed:", err);
    return FALLBACK;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MonitoringScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(true);
  const [modelStatus, setModelStatus] = useState<ModelStatus>("Loading...");
  const [lastPrediction, setLastPrediction] = useState<PredictionResult | null>(
    null,
  );
  const [bufferCount, setBufferCount] = useState(0);
  const [sessionInitError, setSessionInitError] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [overlayColor, setOverlayColor] = useState("rgba(255, 0, 0, 0.7)");

  /** Animated value drives the red danger overlay opacity */
  const dangerOpacity = useRef(new Animated.Value(0)).current;

  const cameraRef = useRef<any>(null);
  const modelSessionRef = useRef<OrtSession | null>(null);
  const ortModuleRef = useRef<OrtModule | null>(null);
  const isProcessingRef = useRef(false);
  const isStoppingRef = useRef(false);
  const temporalBufferRef = useRef<number[][]>([]);
  const rawTemporalBufferRef = useRef<number[][]>([]);
  const lastPitchRef = useRef<number>(PITCH_BASELINE); // Initialised to baseline, not 0
  const noFaceCountRef = useRef<number>(0);
  const sessionInitRef = useRef(false);
  const lastDrowsyAlertTimeRef = useRef(0);
  const lastDistractedAlertTimeRef = useRef(0);
  const lastModelLogRef = useRef(0);
  const lastModelFeaturesRef = useRef<number[] | null>(null);
  const lastFaceLossEventTimeRef = useRef(0);
  const isAppActiveRef = useRef(AppState.currentState === "active");
  const lastForegroundTimeRef = useRef(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const inferenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const runInferenceCycleRef = useRef<() => void>(() => undefined);
  const isMountedRef = useRef(true);
  const speechAvailableRef = useRef(false);
  const speechModuleRef = useRef<typeof import("expo-speech") | null>(null);

  // ── Pitch anchor ref: captured once on first valid face detection ─────────
  // Passed into computeFaceFeatures so the anchor persists across calls
  // without triggering re-renders.
  const pitchAnchorRef = useRef<number | null>(null);

  const {
    currentDriver,
    activeSession,
    startSession,
    endSession,
    addSessionEvent,
  } = useSession();

  const parseONNXOutput = (outputTensor: any): PredictionResult => {
    const data = Array.from(outputTensor.data as Float32Array);
    const maxVal = Math.max(...data);
    const maxIdx = data.indexOf(maxVal);
    const stateMap: Record<number, DriverState> = {
      0: "ALERT",
      1: "DROWSY",
      2: "DISTRACTED",
    };
    return {
      state: stateMap[maxIdx] ?? "ALERT",
      confidence: Math.max(0, Math.min(1, maxVal)),
    };
  };

  const triggerDangerAlert = useCallback(
    async (state: DriverState) => {
      if (state === "ALERT") return;
      const now = Date.now();
      
      if (state === "DROWSY") {
        if (now - lastDrowsyAlertTimeRef.current < 5000) return;
        lastDrowsyAlertTimeRef.current = now;
        setOverlayColor("rgba(255, 0, 0, 0.7)");
      } else if (state === "DISTRACTED") {
        if (now - lastDistractedAlertTimeRef.current < 15000) return;
        lastDistractedAlertTimeRef.current = now;
        setOverlayColor("rgba(255, 165, 0, 0.7)");
      }

      Animated.sequence([
        Animated.timing(dangerOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(dangerOpacity, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

      try {
        if (state === "DISTRACTED") {
          if (speechAvailableRef.current && speechModuleRef.current) {
            const Speech = speechModuleRef.current;
            const isSpeaking = await Speech.isSpeakingAsync();
            if (isSpeaking) {
              await Speech.stop();
              await delay(100);
            }
            Speech.speak("Warning! Eyes on the road.", { language: "en", rate: 1.1, pitch: 1.0 });
          }
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else if (state === "DROWSY") {
          if (speechAvailableRef.current && speechModuleRef.current) {
            speechModuleRef.current.speak("WAKE UP! WAKE UP!", { language: "en", rate: 1.2, pitch: 1.5 });
          }
          for (let i = 0; i < 3; i++) {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            await delay(150);
          }
        }
      } catch (error) {
        console.warn("[Alerts] Failed to play alert:", error);
      }
    },
    [dangerOpacity],
  );

  const scheduleNextInference = useCallback(() => {
    if (inferenceTimeoutRef.current) {
      clearTimeout(inferenceTimeoutRef.current);
    }
    inferenceTimeoutRef.current = setTimeout(() => {
      runInferenceCycleRef.current();
    }, PROCESS_INTERVAL_MS);
  }, []);

  const runInferenceCycle = useCallback(async () => {
    if (
      isProcessingRef.current ||
      isStoppingRef.current ||
      !modelSessionRef.current ||
      !ortModuleRef.current ||
      !activeSession?.id ||
      !cameraRef.current ||
      !isAppActiveRef.current ||
      Date.now() - lastForegroundTimeRef.current < 1000
    ) {
      if (
        isMountedRef.current &&
        isAppActiveRef.current &&
        !isStoppingRef.current
      ) {
        scheduleNextInference();
      }
      return;
    }

    isProcessingRef.current = true;
    let photoUri: string | undefined;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.35,
        skipProcessing: true,
      });
      photoUri = photo?.uri;
      if (!photoUri) return;

      // Pass pitchAnchorRef so the dynamic proxy persists across frames
      const faceFeatures = await computeFaceFeatures(photoUri, pitchAnchorRef);

      if (!faceFeatures.face_detected) {
        noFaceCountRef.current += 1;
        console.log(
          `[Monitoring] Face lost. Count: ${noFaceCountRef.current}/10`,
        );
        if (noFaceCountRef.current >= 10) {
          const now = Date.now();
          if (now - lastFaceLossEventTimeRef.current > 15000) {
            console.log("[Monitoring] No-face DISTRACTED payload fired.");
            triggerDangerAlert("DISTRACTED");
            addSessionEvent("DISTRACTED", 1.0, { reason: "no_face_detected" });
            lastFaceLossEventTimeRef.current = now;
          } else {
            console.log(
              "[Monitoring] No-face DISTRACTED bypassed due to 15s cooldown.",
            );
          }
          return;
        }
      } else {
        if (noFaceCountRef.current > 0) {
          console.log("[Monitoring] Face detected. Counter reset.");
        }
        noFaceCountRef.current = 0;
      }

      let normalizedFeatures = [0, 0, 0, 0, 0, 0, 0];
      let rawFeaturesToPush = [0, 0, 0, 0, 0];
      let modelFeaturesRaw: number[] | null = null;
      let perclosValue: number | null = null;
      let pitchVelocityValue: number | null = null;
      let reusedFrame = false;

      if (faceFeatures.face_detected) {
        const rawFeatures = [
          faceFeatures.ear,
          faceFeatures.mar,
          faceFeatures.pitch,
          faceFeatures.yaw,
          faceFeatures.roll,
        ];

        rawFeaturesToPush = rawFeatures;

        // PERCLOS uses mapped EAR values — threshold now correctly calibrated to 0.20
        const earHistory = rawTemporalBufferRef.current.map(
          (frame) => frame[0],
        );
        const perclos = computePerclos(
          [...earHistory, rawFeatures[0]].slice(-60),
        );

        // pitch_velocity: delta from last pitch proxy value
        // lastPitchRef is initialised to PITCH_BASELINE (not 0), so first-frame
        // velocity is ~0 as expected for a stationary driver.
        const rawVelocity = faceFeatures.pitch - lastPitchRef.current;
        const pitchVelocity = Math.max(-50, Math.min(50, rawVelocity));

        if (Math.abs(rawVelocity) > 50) {
          console.log(
            "[Monitoring] CLAMPED pitch velocity:",
            rawVelocity,
            "->",
            pitchVelocity,
          );
        }

        perclosValue = perclos;
        pitchVelocityValue = pitchVelocity;
        const modelFeatures = [...rawFeatures, perclos, pitchVelocity];
        modelFeaturesRaw = modelFeatures;
        lastModelFeaturesRef.current = modelFeatures;

        // Z-score standardization using Python-trained scaler constants
        normalizedFeatures = modelFeatures.map((val, index) => {
          const std = SCALER_STD[index] === 0 ? 1 : SCALER_STD[index];
          return (val - SCALER_MEAN[index]) / std;
        });

        lastPitchRef.current = faceFeatures.pitch;
      } else if (temporalBufferRef.current.length > 0) {
        // Reuse last known frame (face briefly lost)
        normalizedFeatures =
          temporalBufferRef.current[temporalBufferRef.current.length - 1];
        rawFeaturesToPush =
          rawTemporalBufferRef.current[
            rawTemporalBufferRef.current.length - 1
          ] || rawFeaturesToPush;
        modelFeaturesRaw = lastModelFeaturesRef.current;
        reusedFrame = true;
      }

      const rawFeaturesSnapshot = [...rawFeaturesToPush];
      const normalizedSnapshot = [...normalizedFeatures];
      for (let i = 0; i < FRAME_MULTIPLIER; i++) {
        rawTemporalBufferRef.current.push([...rawFeaturesSnapshot]);
        temporalBufferRef.current.push([...normalizedSnapshot]);
      }

      if (temporalBufferRef.current.length > 60) {
        temporalBufferRef.current = temporalBufferRef.current.slice(-60);
        rawTemporalBufferRef.current = rawTemporalBufferRef.current.slice(-60);
      }

      const nowTs = Date.now();
      const shouldLogModel =
        DEBUG_MODEL_LOGS &&
        (DEBUG_MODEL_LOGS_EVERY_FRAME ||
          nowTs - lastModelLogRef.current >= MODEL_LOG_INTERVAL_MS);

      if (shouldLogModel) {
        const lastNormalizedFrame =
          temporalBufferRef.current[temporalBufferRef.current.length - 1] ||
          normalizedSnapshot;
        const featuresForLog = modelFeaturesRaw ?? [
          rawFeaturesSnapshot[0],
          rawFeaturesSnapshot[1],
          rawFeaturesSnapshot[2],
          rawFeaturesSnapshot[3],
          rawFeaturesSnapshot[4],
          perclosValue ?? 0,
          pitchVelocityValue ?? 0,
        ];
        console.log("[Model] Input features", {
          raw: featuresForLog.map((v) => Number(v.toFixed(4))),
          normalized: lastNormalizedFrame.map((v) => Number(v.toFixed(4))),
          perclos: perclosValue?.toFixed(4),
          pitch_velocity: pitchVelocityValue?.toFixed(4),
          reused: reusedFrame,
          buffer: temporalBufferRef.current.length,
          // Sanity checks — these should all be true for alert driver
          _sanity: {
            EAR_in_alert_range:
              (rawFeaturesSnapshot[0] >= 0.22 &&
                rawFeaturesSnapshot[0] <= 0.31) ||
              "CHECK",
            MAR_in_alert_range:
              (rawFeaturesSnapshot[1] >= 0.85 &&
                rawFeaturesSnapshot[1] <= 1.2) ||
              "CHECK",
            pitch_near_baseline:
              Math.abs(rawFeaturesSnapshot[2] - PITCH_BASELINE) < 15 || "CHECK",
            roll_unwrapped: Math.abs(rawFeaturesSnapshot[4]) < 30 || "CHECK",
          },
        });
      }

      if (isMountedRef.current) {
        setBufferCount(temporalBufferRef.current.length);
      }

      if (temporalBufferRef.current.length < 60) {
        console.log(
          `[Monitoring] Buffer accumulating: ${temporalBufferRef.current.length}/60`,
        );
      }

      if (temporalBufferRef.current.length === 60) {
        const inputData = new Float32Array(420); // 60 * 7
        for (let i = 0; i < 60; i++) {
          const frame = temporalBufferRef.current[i];
          inputData[i * 7 + 0] = frame[0];
          inputData[i * 7 + 1] = frame[1];
          inputData[i * 7 + 2] = frame[2];
          inputData[i * 7 + 3] = frame[3];
          inputData[i * 7 + 4] = frame[4];
          inputData[i * 7 + 5] = frame[5];
          inputData[i * 7 + 6] = frame[6];
        }

        const inputTensor = new ortModuleRef.current.Tensor(
          "float32",
          inputData,
          [1, 60, 7],
        );
        const session = modelSessionRef.current;
        const feeds: Record<string, any> = {
          [session.inputNames[0]]: inputTensor,
        };

        let results: Record<string, any> | undefined;
        try {
          results = await session.run(feeds);
        } catch (runError) {
          console.error("[ONNX] session.run failed:", runError);
          return;
        }

        const outputTensor = results[session.outputNames[0]];
        const prediction = parseONNXOutput(outputTensor);

        if (shouldLogModel) {
          const scores = Array.from(outputTensor.data as Float32Array);
          const probabilities = softmax(scores);
          console.log("[Model] Output", {
            class_order: ["ALERT", "DROWSY", "DISTRACTED"],
            scores: scores.map((v) => Number(v.toFixed(4))),
            probabilities: probabilities.map((v) => Number(v.toFixed(4))),
            prediction,
          });
        }

        if (isMountedRef.current) {
          setLastPrediction(prediction);
        }

        if (prediction.state !== "ALERT") triggerDangerAlert(prediction.state);
        addSessionEvent(prediction.state, prediction.confidence, {
          ear: normalizedFeatures[0],
          mar: normalizedFeatures[1],
          headpose: {
            pitch: normalizedFeatures[2],
            yaw: normalizedFeatures[3],
            roll: normalizedFeatures[4],
          },
          model_version: MODEL_VERSION,
        });
      } else if (isMountedRef.current) {
        setLastPrediction(null);
      }

      if (shouldLogModel) {
        lastModelLogRef.current = nowTs;
      }
    } catch (error) {
      if (isAppActiveRef.current)
        console.error("[Monitoring] Inference cycle failed:", error);
    } finally {
      if (photoUri) {
        try {
          await FileSystem.deleteAsync(photoUri, { idempotent: true });
        } catch (error) {
          console.warn("[Monitoring] Failed to delete temp photo:", error);
        }
      }
      isProcessingRef.current = false;
      if (
        isMountedRef.current &&
        isAppActiveRef.current &&
        !isStoppingRef.current
      ) {
        scheduleNextInference();
      }
    }
  }, [
    activeSession?.id,
    addSessionEvent,
    scheduleNextInference,
    triggerDangerAlert,
  ]);

  useEffect(() => {
    runInferenceCycleRef.current = () => {
      void runInferenceCycle();
    };
  }, [runInferenceCycle]);

  const loadModel = useCallback(async () => {
    try {
      const isExpoGo = Constants.appOwnership === "expo";
      if (isExpoGo) {
        if (isMountedRef.current) setModelStatus("Dev Build Required");
        return;
      }
      const modelPath = await ensureModelExists();
      const ort = await import("onnxruntime-react-native");
      ortModuleRef.current = ort;
      const session = await ort.InferenceSession.create(
        modelPath.replace("file://", ""),
      );
      modelSessionRef.current = session;

      console.log("[ONNX] Inputs:", session.inputNames);
      console.log("[ONNX] Outputs:", session.outputNames);

      // Warmup: feed a neutral alert-range tensor to pre-JIT the model
      try {
        const warmupData = new Float32Array(420);
        // Fill with Z-score 0 (mean-normalised alert baseline)
        // so the warmup tensor is in-distribution rather than all-zeros
        for (let i = 0; i < 60; i++) {
          warmupData[i * 7 + 0] = 0.0; // EAR at mean
          warmupData[i * 7 + 1] = 0.0; // MAR at mean
          warmupData[i * 7 + 2] = 0.0; // pitch at mean
          warmupData[i * 7 + 3] = 0.0; // yaw at mean
          warmupData[i * 7 + 4] = 0.0; // roll at mean
          warmupData[i * 7 + 5] = 0.0; // PERCLOS at mean
          warmupData[i * 7 + 6] = 0.0; // pitch_velocity at mean
        }
        const warmupTensor = new ort.Tensor("float32", warmupData, [1, 60, 7]);
        const feeds: Record<string, any> = {
          [session.inputNames[0]]: warmupTensor,
        };
        await session.run(feeds);
        console.log("[ONNX] Warmup complete.");
      } catch (e) {
        console.warn("[ONNX] Warmup failed:", e);
      }

      if (isMountedRef.current) setModelStatus("Ready");
    } catch (error) {
      console.error("[ONNX] Model load failed:", error);
      if (isMountedRef.current) setModelStatus("Failed");
    }
  }, []);

  const requestAllPermissions = useCallback(async () => {
    setIsRequestingPermissions(true);
    try {
      if (!cameraPermission?.granted) await requestCameraPermission();
    } finally {
      setIsRequestingPermissions(false);
    }
  }, [cameraPermission?.granted, requestCameraPermission]);

  const handleStopMonitoring = useCallback(async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    sessionInitRef.current = false;
    setSessionInitError(null);
    if (inferenceTimeoutRef.current) {
      clearTimeout(inferenceTimeoutRef.current);
      inferenceTimeoutRef.current = null;
    }
    try {
      const completedSession = await endSession();
      if (completedSession?.id) {
        router.replace({
          pathname: "/session-summary",
          params: { sessionId: completedSession.id },
        });
        return;
      }
    } catch (error) {
      console.error("[Monitoring] Failed to end session cleanly:", error);
    }
    router.replace("/(tabs)");
  }, [endSession]);

  const handleAuthExpired = useCallback(async () => {
    try {
      await endSession();
    } catch (error) {
      console.warn(
        "[Monitoring] Failed to end session after auth expiry:",
        error,
      );
    } finally {
      router.replace("/(auth)/login");
    }
  }, [endSession]);

  const handleStopRef = useRef(handleStopMonitoring);
  useEffect(() => {
    handleStopRef.current = handleStopMonitoring;
  }, [handleStopMonitoring]);

  useEffect(() => {
    isMountedRef.current = true;
    sessionInitRef.current = false;
    return () => {
      isMountedRef.current = false;
      sessionInitRef.current = false;
      isProcessingRef.current = false;
      if (inferenceTimeoutRef.current) {
        clearTimeout(inferenceTimeoutRef.current);
        inferenceTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    const loadSpeechModule = async () => {
      try {
        const Speech = await import("expo-speech");
        if (!isActive) return;
        try {
          await Speech.isSpeakingAsync();
        } catch (error) {
          if (!isActive) return;
          speechModuleRef.current = null;
          speechAvailableRef.current = false;
          console.warn(
            "[Speech] Native module unavailable - audio alerts disabled",
            error,
          );
          return;
        }
        speechModuleRef.current = Speech;
        speechAvailableRef.current = true;
      } catch (error) {
        if (!isActive) return;
        speechModuleRef.current = null;
        speechAvailableRef.current = false;
        console.warn("[Speech] Expo speech module unavailable:", error);
      }
    };
    void loadSpeechModule();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const checkAuth = async () => {
      try {
        const hasToken = await tokenManager.hasValidToken();
        const hasDriver = !!currentDriver;
        if (!hasToken || !hasDriver) {
          if (!cancelled) {
            setIsAuthenticated(false);
            setIsAuthReady(true);
          }
          router.replace("/(auth)/login");
          return;
        }
        if (!cancelled) {
          setIsAuthenticated(true);
          setIsAuthReady(true);
        }
      } catch (error) {
        console.warn("[Auth] Failed to verify token:", error);
        if (!cancelled) {
          setIsAuthenticated(false);
          setIsAuthReady(true);
        }
        router.replace("/(auth)/login");
      }
    };

    void checkAuth();
    return () => {
      cancelled = true;
    };
  }, [currentDriver]);

  const initBackendSession = useCallback(async () => {
    if (sessionInitRef.current) return;
    sessionInitRef.current = true;
    try {
      await startSession();
      if (isMountedRef.current) setSessionInitError(null);
    } catch (error: any) {
      sessionInitRef.current = false;
      if (error?.name === "AuthError") {
        Alert.alert(
          "Session expired",
          "Session expired. Please log in again.",
          [
            {
              text: "Log in",
              onPress: () => {
                void handleAuthExpired();
              },
            },
          ],
        );
        return;
      }
      if (isMountedRef.current) {
        setSessionInitError(
          error?.message || "Failed to start backend monitoring session.",
        );
      }
    }
  }, [handleAuthExpired, startSession]);

  // 1. Request camera on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    void requestAllPermissions();
  }, [isAuthenticated, requestAllPermissions]);

  // 2. Load ONNX model on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    void loadModel();
  }, [isAuthenticated, loadModel]);

  // 3. Start backend session once — model ready + camera granted + not yet started
  useEffect(() => {
    if (!isAuthenticated || sessionInitError) return;
    if (
      modelStatus === "Ready" &&
      !!cameraPermission?.granted &&
      !sessionInitRef.current
    ) {
      void initBackendSession();
    }
  }, [
    cameraPermission?.granted,
    initBackendSession,
    isAuthenticated,
    modelStatus,
    sessionInitError,
  ]);

  // 4. AppState — pause inference; auto-end session after 90 s in background
  useEffect(() => {
    const BG_AUTO_END_MS = 90_000;
    let bgTimer: ReturnType<typeof setTimeout> | null = null;

    const clearBgTimer = () => {
      if (bgTimer) {
        clearTimeout(bgTimer);
        bgTimer = null;
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        const wasActive = appStateRef.current === "active";
        const isNowActive = nextState === "active";
        appStateRef.current = nextState;
        isAppActiveRef.current = isNowActive;

        if (isNowActive) {
          clearBgTimer();
          lastForegroundTimeRef.current = Date.now();

          // Clear buffers + reset pitch anchor on resume so stale data
          // doesn't pollute the new session context
          temporalBufferRef.current = [];
          rawTemporalBufferRef.current = [];
          noFaceCountRef.current = 0;
          lastPitchRef.current = PITCH_BASELINE; // Reset to baseline, not 0
          lastDrowsyAlertTimeRef.current = 0;
          lastDistractedAlertTimeRef.current = 0;
          pitchAnchorRef.current = null; // Re-anchor on next valid face detection
          isProcessingRef.current = false;
          setBufferCount(0);

          if (!wasActive) {
            console.log(
              "[Monitoring] Resumed — buffers cleared, pitch anchor reset",
            );
          }

          if (
            modelStatus === "Ready" &&
            !!cameraPermission?.granted &&
            !!activeSession?.id &&
            isAuthenticated
          ) {
            scheduleNextInference();
          }
        } else if (wasActive && !isNowActive) {
          clearBgTimer();
          console.log(
            "[Monitoring] Backgrounded — inference paused, auto-end in 90 s",
          );
          bgTimer = setTimeout(() => {
            console.log(
              "[Monitoring] 90 s background limit reached — auto-ending session",
            );
            void handleStopRef.current();
          }, BG_AUTO_END_MS);
        }
      },
    );

    return () => {
      subscription.remove();
      clearBgTimer();
    };
  }, [
    activeSession?.id,
    cameraPermission?.granted,
    isAuthenticated,
    modelStatus,
    scheduleNextInference,
  ]);

  // 5. Start inference loop once all conditions are met
  useEffect(() => {
    const canProcess =
      modelStatus === "Ready" &&
      !!cameraPermission?.granted &&
      !!activeSession?.id &&
      isAuthenticated;

    if (!canProcess) {
      if (inferenceTimeoutRef.current) {
        clearTimeout(inferenceTimeoutRef.current);
        inferenceTimeoutRef.current = null;
      }
      return;
    }

    scheduleNextInference();

    return () => {
      if (inferenceTimeoutRef.current) {
        clearTimeout(inferenceTimeoutRef.current);
        inferenceTimeoutRef.current = null;
      }
    };
  }, [
    activeSession?.id,
    cameraPermission?.granted,
    isAuthenticated,
    modelStatus,
    scheduleNextInference,
  ]);

  // ─── Derived display values ───────────────────────────────────────────────
  const isDangerous =
    lastPrediction?.state === "DROWSY" ||
    lastPrediction?.state === "DISTRACTED";

  const predictionColor =
    lastPrediction?.state === "ALERT"
      ? "#4CAF50"
      : lastPrediction?.state === "DROWSY"
        ? "#F44336"
        : "#FF9800";

  // ─── Render: Auth Check ──────────────────────────────────────────────────
  if (!isAuthReady) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Checking session…</Text>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // ─── Render: Permissions Loading ─────────────────────────────────────────
  if (isRequestingPermissions && !cameraPermission) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Requesting camera access...</Text>
      </SafeAreaView>
    );
  }

  // ─── Render: No Permission ────────────────────────────────────────────────
  if (!cameraPermission?.granted) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <View style={styles.permissionCard}>
          <Ionicons name="videocam-outline" size={64} color="#FF8A00" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            Camera access is required to run driver monitoring.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              void requestAllPermissions();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Grant Permission</Text>
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

  // ─── Render: Session Init Error ──────────────────────────────────────────
  if (sessionInitError) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <View style={styles.permissionCard}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF8A00" />
          <Text style={styles.permissionTitle}>Session Failed to Start</Text>
          <Text style={styles.permissionText}>{sessionInitError}</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              sessionInitRef.current = false;
              setSessionInitError(null);
              void initBackendSession();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Retry Session</Text>
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

  // ─── Render: Main Monitoring View ─────────────────────────────────────────
  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="front" />

      {/* Danger flash overlay */}
      <Animated.View
        pointerEvents="none"
        style={[styles.dangerOverlay, { opacity: dangerOpacity, backgroundColor: overlayColor }]}
      />

      <SafeAreaView style={styles.overlayContainer} pointerEvents="box-none">
        {/* ── Top HUD ── */}
        <View style={styles.topOverlay}>
          <View style={[styles.hudPill, isDangerous && styles.hudPillDanger]}>
            <View
              style={[styles.statusDot, { backgroundColor: predictionColor }]}
            />
            <Text style={styles.hudText}>
              {lastPrediction
                ? `${lastPrediction.state}  ${Math.round(lastPrediction.confidence * 100)}%`
                : bufferCount < 60
                  ? `Buffering ${bufferCount}/60…`
                  : "Processing sequence…"}
            </Text>
          </View>

          <View style={styles.hudPill}>
            <Text style={styles.hudSubText}>AI: {modelStatus}</Text>
          </View>

          <View style={styles.hudPill}>
            <Text style={styles.hudSubText}>
              Session: {activeSession?.id ? "Connected" : "Connecting…"}
            </Text>
          </View>
        </View>

        {/* ── DROWSY/DISTRACTED Warning Banner ── */}
        {isDangerous && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={22} color="#FFFFFF" />
            <Text style={styles.warningText}>
              {lastPrediction?.state === "DROWSY"
                ? "⚠️  DROWSINESS DETECTED — Stay alert!"
                : "⚠️  DISTRACTION DETECTED — Eyes on road!"}
            </Text>
          </View>
        )}

        {/* ── Bottom Controls ── */}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  camera: { flex: 1 },
  dangerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  topOverlay: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  hudPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 8,
  },
  hudPillDanger: {
    backgroundColor: "rgba(211,47,47,0.85)",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  hudText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  hudSubText: {
    color: "#E0E0E0",
    fontSize: 13,
    fontWeight: "600",
  },
  warningBanner: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(211,47,47,0.92)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 10,
  },
  warningText: {
    flex: 1,
    color: "#FFFFFF",
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
    backgroundColor: "rgba(213,33,49,0.95)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    elevation: 10,
  },
  stopButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
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
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
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
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    width: "100%",
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3A4558",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { color: "#D6E0F0", fontSize: 15, fontWeight: "600" },
});
