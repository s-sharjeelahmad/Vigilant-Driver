import { useState, useEffect } from "react";
import {
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";
import { SessionProvider } from "@/src/context/SessionContext";
import { ThemeProvider } from "@/src/context/ThemeContext";
import AnimatedSplash from "@/src/components/AnimatedSplash";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(auth)/login",
};

export default function RootLayout() {
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Hide the native splash immediately
        await SplashScreen.hideAsync();
        // Mark app as ready after short delay
        setTimeout(() => setAppReady(true), 100);
      } catch (e) {
        console.warn(e);
      }
    }
    prepare();
  }, []);

  if (!appReady || showCustomSplash) {
    return (
      <ThemeProvider>
        <AnimatedSplash onFinish={() => setShowCustomSplash(false)} />
      </ThemeProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SessionProvider>
          <NavigationThemeProvider value={DefaultTheme}>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
              initialRouteName="(auth)/login"
            >
              <Stack.Screen
                name="(auth)/login"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="profile" options={{ headerShown: false }} />
              <Stack.Screen
                name="monitoring"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="edit-profile"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="settings" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </NavigationThemeProvider>
        </SessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
