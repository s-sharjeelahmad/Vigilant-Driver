import React, { createContext, useContext, useState, useEffect } from "react";
import { Driver, Session, ActiveSession, DriverState } from "../types";
import {
  saveDriver,
  loadDriver,
  clearDriver,
  saveSessions,
  loadSessions,
} from "@/src/services/storage";
import { sessionService, AuthError } from "@/src/services/sessionService";
import { tokenManager } from "@/src/services/apiClient";
import { router } from "expo-router";
interface SessionContextType {
  // Driver State
  currentDriver: Driver | null;
  setCurrentDriver: (driver: Driver | null) => void;

  // Active Session
  activeSession: ActiveSession | null;
  startSession: () => Promise<void>;
  endSession: () => Promise<Session | null>;
  addSessionEvent: (state: DriverState, confidence: number) => void;

  // Session History
  sessionHistory: Session[];
  loadHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;

  // Loading State
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Memory management constants
const EVENT_PRUNE_THRESHOLD = 600; // Start pruning at this count
const EVENT_PRUNE_BATCH = 100; // Remove this many oldest events when pruning

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentDriver, setCurrentDriverState] = useState<Driver | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    null,
  );
  const [sessionHistory, setSessionHistory] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved data on mount
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedDriver = await loadDriver();
        const savedSessions = await loadSessions();

        // Restore authenticated driver from storage
        if (savedDriver) {
          setCurrentDriverState(savedDriver);
        }

        if (savedSessions && Array.isArray(savedSessions)) {
          setSessionHistory(savedSessions);
        }
      } catch (error) {
        console.error("Error loading saved data:", error);
        // Don't throw error, just log it - app should still work
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedData();
  }, []);

  // Set current driver and persist
  const setCurrentDriver = async (driver: Driver | null) => {
    try {
      setCurrentDriverState(driver);
      if (driver) {
        await saveDriver(driver);
      }
    } catch (error) {
      console.error("Error setting current driver:", error);
      // Don't throw, just log - state is already updated
    }
  };

  // Start a new monitoring session
  const startSession = async () => {
    if (!currentDriver) {
      console.warn("❌ Cannot start session: No driver selected");
      return;
    }

    try {
      // Call backend API: POST /driver/newsession (JWT attached by apiClient interceptor)
      const backendSession = await sessionService.startSession();

      const newSession: ActiveSession = {
        id: backendSession.session_id,
        driverId: currentDriver.id,
        startTime: backendSession.start_time,
        events: [],
      };

      setActiveSession(newSession);
      console.log("✅ Session started on backend:", backendSession.session_id);
    } catch (error: any) {
      // 401 Unauthorized — token expired or invalid: force logout
      if (error instanceof AuthError) {
        console.warn(
          "🔐 Auth error starting session — clearing session and redirecting to login",
        );
        await tokenManager.deleteToken();
        await clearDriver();
        setCurrentDriverState(null);
        setActiveSession(null);
        router.replace("/(auth)/login");
        return;
      }

      // Non-auth failure (network issue, already-active session, etc.) — surface error to caller
      console.error("❌ Failed to start session:", error.message);
      throw error; // Let monitoring.tsx catch and show Alert to user
    }
  };

  // Add an event to the current session with memory management
  const addSessionEvent = (state: DriverState, confidence: number) => {
    if (!activeSession) {
      console.warn("⚠️ Cannot add event: No active session");
      return;
    }

    const event = {
      timestamp: new Date().toISOString(),
      state,
      confidence,
    };

    // Create updated events array
    const updatedEvents = [...activeSession.events, event];

    // Memory management: Prune oldest events if exceeding threshold
    if (updatedEvents.length > EVENT_PRUNE_THRESHOLD) {
      console.warn(
        `⚠️ Event count (${updatedEvents.length}) exceeded threshold - pruning oldest ${EVENT_PRUNE_BATCH} events`,
      );
      updatedEvents.splice(0, EVENT_PRUNE_BATCH);
    }

    // Log periodically (every 10 events) to reduce console spam
    if (updatedEvents.length % 10 === 0) {
      console.log(
        `📝 Events: ${
          updatedEvents.length
        } | Latest: ${state} (${confidence.toFixed(0)}%)`,
      );
    }

    setActiveSession({
      ...activeSession,
      events: updatedEvents,
    });
  };

  // End the current session and calculate statistics
  const endSession = async (): Promise<Session | null> => {
    if (!activeSession) {
      console.warn("⚠️ Cannot end session: No active session");
      return null;
    }

    try {
      const endTime = new Date().toISOString();
      const startTime = new Date(activeSession.startTime);
      const endTimeDate = new Date(endTime);
      const durationSeconds = Math.floor(
        (endTimeDate.getTime() - startTime.getTime()) / 1000,
      );

      // Calculate state breakdown
      const stateBreakdown = {
        ALERT: 0,
        DROWSY: 0,
        DISTRACTED: 0,
      };

      activeSession.events.forEach((event) => {
        if (event && event.state) {
          stateBreakdown[event.state]++;
        }
      });

      // Calculate attention score (0-100)
      const totalEvents = activeSession.events.length || 1;
      const alertPercentage = (stateBreakdown.ALERT / totalEvents) * 100;
      const drowsyPercentage = (stateBreakdown.DROWSY / totalEvents) * 100;
      const distractedPercentage =
        (stateBreakdown.DISTRACTED / totalEvents) * 100;

      // Percentages for display
      const percentages = {
        ALERT: Number(alertPercentage.toFixed(1)),
        DROWSY: Number(drowsyPercentage.toFixed(1)),
        DISTRACTED: Number(distractedPercentage.toFixed(1)),
      };

      // Weighted score: ALERT=100, DISTRACTED=50, DROWSY=0
      const attentionScore = Math.round(
        alertPercentage * 1.0 +
          distractedPercentage * 0.5 +
          drowsyPercentage * 0.0,
      );

      // Call backend API to end session (if not local)
      if (!activeSession.id.startsWith("local_")) {
        try {
          await sessionService.endSession(
            "completed",
            "User stopped monitoring",
          );
          console.log("✅ Session ended on backend");
        } catch (error: any) {
          console.error("⚠️ Failed to end session on backend:", error.message);
        }
      }

      const completedSession: Session = {
        id: activeSession.id,
        driverId: activeSession.driverId,
        startTime: activeSession.startTime,
        endTime,
        duration: durationSeconds,
        attentionScore,
        events: activeSession.events,
        stateBreakdown,
        percentages,
      };

      // Add to history and save
      const updatedHistory = [completedSession, ...sessionHistory];
      setSessionHistory(updatedHistory);

      // Save asynchronously, don't wait
      saveSessions(updatedHistory).catch((err) => {
        console.error("Failed to save session:", err);
      });

      // Clear active session
      setActiveSession(null);

      return completedSession;
    } catch (error) {
      console.error("Error ending session:", error);
      // Clear active session even if there's an error
      setActiveSession(null);
      return null;
    }
  };

  // Load session history from storage
  const loadHistory = async () => {
    try {
      const sessions = await loadSessions();
      if (sessions && Array.isArray(sessions)) {
        setSessionHistory(sessions);
      }
    } catch (error) {
      console.error("Error loading session history:", error);
    }
  };

  // Clear all session history
  const clearHistory = async () => {
    try {
      setSessionHistory([]);
      await saveSessions([]);
    } catch (error) {
      console.error("Error clearing session history:", error);
    }
  };

  // Delete individual session
  const deleteSession = async (sessionId: string) => {
    try {
      const updatedHistory = sessionHistory.filter((s) => s.id !== sessionId);
      setSessionHistory(updatedHistory);
      await saveSessions(updatedHistory);
    } catch (error) {
      console.error("Error deleting session:", error);
      // Revert on error
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

// Custom hook to use the session context
export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
