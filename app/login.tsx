import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "../context/AuthContext";

function Leaf({
  size,
  color,
  opacity,
  style,
}: {
  size: number;
  color: string;
  opacity: number;
  style?: any;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" style={style}>
      <Path
        d="M100 10 C160 40 180 100 100 190 C20 100 40 40 100 10 Z"
        fill={color}
        fillOpacity={opacity}
      />
      <Path
        d="M100 25 L100 175"
        stroke={color}
        strokeOpacity={opacity + 0.03}
        strokeWidth={2}
      />
    </Svg>
  );
}

export default function LoginScreen() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (user) {
    return <Redirect href="/home" />;
  }

  async function handleLogin() {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Login failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ImageBackground
      source={require("../assets/images/pic3.png")}
      style={styles.page}
      resizeMode="cover"
    >
      {/* Dark green overlay so text stays readable over the photo */}
      <LinearGradient
        colors={[
          "rgba(8,50,30,0.55)",
          "rgba(8,50,30,0.72)",
          "rgba(8,50,30,0.85)",
        ]}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* BRAND */}
          <View style={styles.brand}>
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandName}>
              Foundation<Text style={styles.brandAccent}>Link</Text>
            </Text>
            <View style={styles.taglineRow}>
              <Text style={styles.tagline}>Share More, Help More</Text>
              <Ionicons name="heart" size={16} color="#ffffff" />
            </View>
          </View>

          {/* CARD */}
          <View style={styles.card}>
            <Leaf
              size={180}
              color="#22a366"
              opacity={0.08}
              style={styles.leafTopRight}
            />
            <Leaf
              size={130}
              color="#2db870"
              opacity={0.07}
              style={styles.leafBottomLeft}
            />

            <View style={styles.rightLogoWrap}>
              <Ionicons
                name="person-circle-outline"
                size={56}
                color="#1a8a52"
              />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Login to continue to your account
            </Text>

            <View
              style={[
                styles.inputGroup,
                focusedField === "email" && styles.inputGroupFocused,
              ]}
            >
              <View
                style={[
                  styles.inputIcon,
                  focusedField === "email" && styles.inputIconFocused,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={19}
                  color={focusedField === "email" ? "#2db870" : "#7a9a8c"}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#c0d4ca"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View
              style={[
                styles.inputGroup,
                focusedField === "password" && styles.inputGroupFocused,
              ]}
            >
              <View
                style={[
                  styles.inputIcon,
                  focusedField === "password" && styles.inputIconFocused,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color={focusedField === "password" ? "#2db870" : "#7a9a8c"}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#c0d4ca"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={19}
                  color={focusedField === "password" ? "#2db870" : "#7a9a8c"}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.rowOptions}>
              <TouchableOpacity onPress={() => router.push("/forgot-password")}>
                <Text style={styles.forgot}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#22a366", "#157042"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.button, isLoading && styles.buttonDisabled]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Login</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>
                {"Don't have an account? "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/register")}>
                <Text style={styles.registerLink}>Register Here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingTop: 60,
  },

  brand: { alignItems: "center", marginBottom: 28 },
  brandLogo: { width: 72, height: 72, marginBottom: 6 },
  brandName: {
    fontFamily: "Nunito_900Black",
    fontSize: 24,
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  brandAccent: { color: "#9ff0c4" },
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  tagline: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 15,
    color: "#ffffff",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 28,
    overflow: "hidden",
    shadowColor: "#005028",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  leafTopRight: {
    position: "absolute",
    top: -40,
    right: -40,
    transform: [{ rotate: "18deg" }],
  },
  leafBottomLeft: {
    position: "absolute",
    bottom: -30,
    left: -30,
    transform: [{ rotate: "-25deg" }],
  },

  rightLogoWrap: { marginBottom: 14, alignItems: "center" },
  title: {
    fontFamily: "Nunito_900Black",
    fontSize: 24,
    color: "#111",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "#9aaea6",
    marginBottom: 26,
    textAlign: "center",
  },

  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#ddeee6",
    borderRadius: 12,
    marginBottom: 14,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  inputGroupFocused: { borderColor: "#2db870" },
  inputIcon: {
    width: 46,
    height: 50,
    backgroundColor: "#f0faf5",
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1.5,
    borderRightColor: "#ddeee6",
  },
  inputIconFocused: { backgroundColor: "#e4f7ed", borderRightColor: "#2db870" },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 14,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 14.5,
    color: "#1a1a1a",
  },
  eyeIcon: {
    width: 42,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },

  rowOptions: { alignItems: "flex-end", marginBottom: 18 },
  forgot: { fontFamily: "Nunito_700Bold", fontSize: 13, color: "#2db870" },

  error: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "#cc3333",
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "#ffd0d0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },

  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1a8a52",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 15.5,
    color: "#fff",
    letterSpacing: 0.3,
  },

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  registerText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "#9aaea6",
  },
  registerLink: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 13,
    color: "#1a8a52",
  },
});
