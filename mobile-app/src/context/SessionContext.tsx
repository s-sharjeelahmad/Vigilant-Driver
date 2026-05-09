import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Driver, Session, ActiveSession, DriverState, StateCounts } from "../types";
import {
  saveDriver,
  loadDriver,
  clearDriver,
  saveSessions,
  loadSessions,
} from "@/src/services/storage";
import { sessionService, AuthError } from "@/src/services/sessionService";
import { SessionMetricsPayload, tokenManager, sendDriverEvent, updateSessionMetrics } from "@/src/services/apiClient";
import { router } from "expo-router";

const ACTIVE_SESSION_STORAGE_KEY = "active_session_id";

const RECENT_EVENTS_LIMIT = 20;

interface SessionContextType {
  // Driver State
  currentDriver: Driver | null;
  setCurrentDriver: (driver: Driver | null) => void;

  // Active Session
  activeSession: ActiveSession | null;
  startSession: () => Promise<void>;
  endSession: () => Promise<Session | null>;
  addSessionEvent: (state: DriverState, confidence: number, features?: Record<string, unknown>) => void;

  // Session History
  sessionHistory: Session[];
  loadHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;

  // Loading State
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentDriver, setCurrentDriverState] = useState<Driver | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isEndingSessionRef = useRef(false);
  const failedEventsQueueRef = useRef<any[]>([]);

  // Load saved data on mount; clean up any stale session from a previous crash
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedDriver = await loadDriver();
        const savedSessions = await loadSessions();
        if (savedDriver) setCurrentDriverState(savedDriver);
        if (savedSessions && Array.isArray(savedSessions)) {
          setSessionHistory(savedSessions);
        }

        // Crash recovery: if the app was killed during monitoring, a stale session
        // ID is left in AsyncStorage. End it on the backend so the next launch
        // won't get the 400 "already has an active session" error.
        const staleSessionId = await AsyncStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
        if (staleSessionId) {
          console.warn("[Session] Found stale session from crash — ending it:", staleSessionId);
          try {
            await sessionService.endSession("interrupted", "App was terminated unexpectedly");
          } catch {
            // Best-effort: ignore if backend already cleaned it up
          } finally {
            await AsyncStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error("Error loading saved data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSavedData();
  }, []);

  const setCurrentDriver = useCallback(async (driver: Driver | null) => {
    try {
      setCurrentDriverState(driver);
      if (driver) {
        await saveDriver(driver);
      } else {
        await clearDriver();
        await tokenManager.deleteToken();
        setActiveSession(null);
      }
    } catch (error) {
      console.error("Error setting current driver:", error);
    }
  }, []);

  const startSession = useCallback(async () => {
    if (!currentDriver) {
      console.warn("❌ Cannot start session: No driver selected");
      return;
    }

    try {
      const backendSession = await sessionService.startSession();

      const newSession: ActiveSession = {
        id: backendSession.session_id,
        driverId: currentDriver.id,
        startTime: backendSession.start_time,
        counts: { ALERT: 0, DROWSY: 0, DISTRACTED: 0 },
        confidenceSum: 0,
        recentEvents: [],
      };

      setActiveSession(newSession);
      // Persist session ID so a crash recovery can clean it up on next launch
      await AsyncStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, backendSession.session_id);
      console.log("✅ Session started on backend:", backendSession.session_id);
    } catch (error: any) {
      if (error instanceof AuthError) {
        console.warn("🔐 Auth error in startSession — clearing stored session");
        await tokenManager.deleteToken();
        await clearDriver();
        setCurrentDriverState(null);
        setActiveSession(null);
        return;
      }
      // If it's a network error, create an offline local session instead of crashing
      if (error.message?.includes("Network Error") || error.message?.includes("Check your connection") || error.message?.includes("Failed to fetch")) {
        console.warn("⚠️ Backend unreachable. Starting offline local session.");
        const localSessionId = `local_${Date.now()}`;
        const newSession: ActiveSession = {
          id: localSessionId,
          driverId: currentDriver.id,
          startTime: new Date().toISOString(),
          counts: { ALERT: 0, DROWSY: 0, DISTRACTED: 0 },
          confidenceSum: 0,
          recentEvents: [],
        };
        setActiveSession(newSession);
        await AsyncStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, localSessionId);
        return;
      }

      console.error("❌ Failed to start session:", error.message);
      throw error;
    }
  }, [currentDriver]);

  /**
   * BUG 4 FIX: O(1) counter increment instead of O(n) array spread.
   * Only the last RECENT_EVENTS_LIMIT events are kept for display.
   */
  const addSessionEvent = useCallback((state: DriverState, confidence: number, features: Record<string, unknown> = {}) => {
    setActiveSession((prev) => {
      if (!prev) return prev;

      const newCounts: StateCounts = {
        ...prev.counts,
        [state]: prev.counts[state] + 1,
      };

      const newEvent = {
        timestamp: new Date().toISOString(),
        state,
        confidence,
      };

      const newRecent =
        prev.recentEvents.length >= RECENT_EVENTS_LIMIT
          ? [...prev.recentEvents.slice(1), newEvent]
          : [...prev.recentEvents, newEvent];

      return { 
        ...prev, 
        counts: newCounts, 
        confidenceSum: prev.confidenceSum + confidence,
        recentEvents: newRecent 
      };
    });

    if (activeSession) {
      sendDriverEvent({
        session_id: activeSession.id,
        state: state,
        confidence: confidence,
        features: features,
      }).catch(() => {
        // Queue for offline sync if network fails
        failedEventsQueueRef.current.push({
          session_id: activeSession.id,
          state: state,
          confidence: confidence,
          features: features,
        });
      });
    }
  }, [activeSession]);

  const endSession = useCallback(async (): Promise<Session | null> => {
    if (!activeSession || !activeSession.id) {
      console.warn("⚠️ Cannot end session: No active session");
      return null;
    }

    if (isEndingSessionRef.current) {
      console.warn("⚠️ endSession already in progress");
      return null;
    }

    isEndingSessionRef.current = true;

    try {
      const endTime = new Date().toISOString();
      const durationSeconds = Math.floor(
        (new Date(endTime).getTime() - new Date(activeSession.startTime).getTime()) / 1000,
      );

      const stateBreakdown = { ...activeSession.counts };
      const totalFrames =
        stateBreakdown.ALERT + stateBreakdown.DROWSY + stateBreakdown.DISTRACTED || 1;

      const alertPct = (stateBreakdown.ALERT / totalFrames) * 100;
      const drowsyPct = (stateBreakdown.DROWSY / totalFrames) * 100;
      const distractedPct = (stateBreakdown.DISTRACTED / totalFrames) * 100;

      const percentages = {
        ALERT: Number(alertPct.toFixed(1)),
        DROWSY: Number(drowsyPct.toFixed(1)),
        DISTRACTED: Number(distractedPct.toFixed(1)),
      };

      const attentionScore = Math.round(alertPct * 1.0 + distractedPct * 0.5);

      // Flush offline queue if any events failed during the session
      if (failedEventsQueueRef.current.length > 0) {
        console.log(`[Session] Flushing ${failedEventsQueueRef.current.length} queued offline events...`);
        await Promise.allSettled(
          failedEventsQueueRef.current.map((event) => sendDriverEvent(event))
        );
        failedEventsQueueRef.current = [];
      }

      if (!activeSession.id.startsWith("local_")) {
        try {
          // Sync all final tallies to the database first
          await updateSessionMetrics({
            session_id: activeSession.id,
            total_frames_processed_increment: totalFrames,
            alert_frames_increment: stateBreakdown.ALERT,
            drowsy_frames_increment: stateBreakdown.DROWSY,
            distracted_frames_increment: stateBreakdown.DISTRACTED,
            average_confidence: Number((activeSession.confidenceSum / totalFrames).toFixed(3)),
            attention_score: attentionScore
          });

          await sessionService.endSession("completed", "Completed");
          console.log("✅ Session metrics and end status synced on backend");
        } catch (error: any) {
          console.error("⚠️ Failed to end session on backend:", error.message);
        }
      }

      // Clear the crash-recovery key now that the session ended cleanly
      await AsyncStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);

      const completedSession: Session = {
        id: activeSession.id,
        driverId: activeSession.driverId,
        startTime: activeSession.startTime,
        endTime,
        duration: durationSeconds,
        attentionScore,
        events: [],
        stateBreakdown,
        percentages,
      };

      const updatedHistory = [completedSession, ...sessionHistory];
      setSessionHistory(updatedHistory);
      saveSessions(updatedHistory).catch((err) =>
        console.error("Failed to save session:", err),
      );

      return completedSession;
    } catch (error) {
      console.error("Error ending session:", error);
      return null;
    } finally {
      setActiveSession(null);
      isEndingSessionRef.current = false;
    }
  }, [activeSession, sessionHistory]);

  const loadHistory = async () => {
    try {
      const sessions = await loadSessions();
      if (sessions && Array.isArray(sessions)) setSessionHistory(sessions);
    } catch (error) {
      console.error("Error loading session history:", error);
    }
  };

  const clearHistory = async () => {
    try {
      setSessionHistory([]);
      await saveSessions([]);
    } catch (error) {
      console.error("Error clearing session history:", error);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const updatedHistory = sessionHistory.filter((s) => s.id !== sessionId);
      setSessionHistory(updatedHistory);
      await saveSessions(updatedHistory);
    } catch (error) {
      console.error("Error deleting session:", error);
      await loadHistory();
    }
  };

  const value: SessionContextType = {
    currentDriver,
    setCurrentDriver,
    activeSession,
    startSession,
    endSession,
    addSessionEvent,
    sessionHistory,
    loadHistory,
    clearHistory,
    deleteSession,
    isLoading,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
