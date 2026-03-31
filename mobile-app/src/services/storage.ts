/**
 * Storage Service - AsyncStorage wrapper for persisting data
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Driver, Session } from "@/src/types";
import { STORAGE_KEYS } from "@/src/utils/constants";

/**
 * Save current driver to storage
 */
export const saveDriver = async (driver: Driver): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.currentDriver,
      JSON.stringify(driver)
    );
  } catch (error) {
    console.error("Error saving driver:", error);
    throw error;
  }
};

/**
 * Load current driver from storage
 */
export const loadDriver = async (): Promise<Driver | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.currentDriver);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error loading driver:", error);
    return null;
  }
};

/**
 * Clear current driver from storage
 */
export const clearDriver = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.currentDriver);
  } catch (error) {
    console.error("Error clearing driver:", error);
    throw error;
  }
};

/**
 * Save session history to storage
 */
export const saveSessions = async (sessions: Session[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.sessions,
      JSON.stringify(sessions)
    );
  } catch (error) {
    console.error("Error saving sessions:", error);
    throw error;
  }
};

/**
 * Load session history from storage
 */
export const loadSessions = async (): Promise<Session[] | null> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.sessions);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error loading sessions:", error);
    return null;
  }
};

/**
 * Clear all session history
 */
export const clearSessions = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.sessions);
  } catch (error) {
    console.error("Error clearing sessions:", error);
    throw error;
  }
};

/**
 * Clear all app data
 */
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error("Error clearing all data:", error);
    throw error;
  }
};
