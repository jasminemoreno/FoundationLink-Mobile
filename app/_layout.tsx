import {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from "@expo-google-fonts/nunito";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import IntroVideo, { INTRO_BACKGROUND } from "../components/IntroVideo";
import PushHandler from "../components/PushHandler";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { pushSupported } from "../utils/push";

// Keep the splash screen up until the Nunito fonts the screens use are loaded.
SplashScreen.preventAutoHideAsync();

// The logo video plays each time the app starts on a phone. The browser build
// is only used for testing, so there it is off unless EXPO_PUBLIC_WEB_INTRO=1.
const SHOW_INTRO = Platform.OS !== "web" || process.env.EXPO_PUBLIC_WEB_INTRO === "1";

function Gate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1a8a52" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [showIntro, setShowIntro] = useState(SHOW_INTRO);
  const [fontsLoaded, fontError] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  // If a font fails to load, carry on with the system font rather than a blank screen.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <StatusBar
        style={showIntro ? "light" : "dark"}
        backgroundColor={showIntro ? INTRO_BACKGROUND : "#ffffff"}
      />
      <AuthProvider>
        <Gate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="foundation/[id]" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="help" />
            <Stack.Screen name="terms" />
            <Stack.Screen name="privacy" />
            <Stack.Screen name="contact" />
          </Stack>
          {/* tapping a phone notification opens its screen (APK only) */}
          {pushSupported ? <PushHandler /> : null}
        </Gate>
      </AuthProvider>
      {/* on top of everything; the app keeps loading underneath */}
      {showIntro ? <IntroVideo onFinish={() => setShowIntro(false)} /> : null}
    </SafeAreaProvider>
  );
}
