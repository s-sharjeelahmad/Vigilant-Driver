import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/src/services/supabase";

const DRIVER_SESSION_KEY = "vigilant_driver_supabase_session";

export interface SupabaseDriver {
  driver_id: string;
  full_name: string;
  cnic: string;
  phone_number?: string | null;
  password: string;
}

export interface DriverLoginInput {
  driver_id: string;
  password: string;
}

const saveDriverSession = async (driver: SupabaseDriver): Promise<void> => {
  await AsyncStorage.setItem(DRIVER_SESSION_KEY, JSON.stringify(driver));
};

export const loadDriverSession = async (): Promise<SupabaseDriver | null> => {
  const raw = await AsyncStorage.getItem(DRIVER_SESSION_KEY);
  return raw ? (JSON.parse(raw) as SupabaseDriver) : null;
};

export const clearDriverSession = async (): Promise<void> => {
  await AsyncStorage.removeItem(DRIVER_SESSION_KEY);
};

export const loginDriverWithSupabase = async (
  input: DriverLoginInput
): Promise<SupabaseDriver> => {
  const driverId = input.driver_id.trim();
  const password = input.password.trim();

  if (!driverId || !password) {
    throw new Error("Driver ID and password are required.");
  }

  const { data, error } = await supabase
    .from("drivers")
    .select("driver_id, full_name, cnic, phone_number, password")
    .eq("driver_id", driverId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to sign in.");
  }

  if (!data) {
    throw new Error("Driver not found.");
  }

  if (data.password !== password) {
    throw new Error("Invalid password.");
  }

  await saveDriverSession(data);
  return data;
};
