import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../services/api";

type Step = "email" | "otp" | "password" | "success";

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendOtp() {
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await api.post("/forgot-password", { email });
      setStep("otp");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyOtp() {
    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const { data } = await api.post("/verify-otp", { email, otp });
      setResetToken(data.reset_token);
      setStep("password");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired code.");
    } finally {
      setIsLoading(false);
    }
  }

  async function resetPassword() {
    if (!password || !passwordConfirmation) {
      setError("Please fill in both fields.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await api.post("/reset-password", {
        email,
        reset_token: resetToken,
        password,
        password_confirmation: passwordConfirmation,
      });
      setStep("success");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={["#d7f2e6", "#c0e8db", "#a8dcc9"]}
      style={styles.page}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
          </View>

          {/* CARD */}
          <View style={styles.card}>
            {/* STEP: EMAIL */}
            {step === "email" && (
              <>
                <View style={styles.iconWrap}>
                  <Ionicons name="mail-outline" size={30} color="#1a8a52" />
                </View>
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.sub}>
                  Enter your email and we will send you a code
                </Text>

                <View style={styles.inputGroup}>
                  <View style={styles.inputIcon}>
                    <Ionicons name="mail-outline" size={18} color="#7a9a8c" />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="#c0d4ca"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <TouchableOpacity
                  onPress={sendOtp}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#22a366", "#157042"]}
                    style={styles.button}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Send Code</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* STEP: OTP */}
            {step === "otp" && (
              <>
                <View style={styles.iconWrap}>
                  <Ionicons name="mail-outline" size={30} color="#1a8a52" />
                </View>
                <Text style={styles.title}>Enter Verification Code</Text>
                <Text style={styles.sub}>
                  We sent a 6-digit code to {email}
                </Text>

                <View style={styles.inputGroup}>
                  <View style={styles.inputIcon}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color="#7a9a8c"
                    />
                  </View>
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="6-digit code"
                    placeholderTextColor="#c0d4ca"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <TouchableOpacity
                  onPress={verifyOtp}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#22a366", "#157042"]}
                    style={styles.button}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Verify Code</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.resendRow}>
                  <Text style={styles.resendText}>Did not get a code? </Text>
                  <TouchableOpacity onPress={sendOtp}>
                    <Text style={styles.resendLink}>Resend</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* STEP: NEW PASSWORD */}
            {step === "password" && (
              <>
                <View style={styles.iconWrap}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={30}
                    color="#1a8a52"
                  />
                </View>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.sub}>Enter your new password below</Text>

                <View style={styles.inputGroup}>
                  <View style={styles.inputIcon}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color="#7a9a8c"
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="New password"
                    placeholderTextColor="#c0d4ca"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputIcon}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color="#7a9a8c"
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm new password"
                    placeholderTextColor="#c0d4ca"
                    value={passwordConfirmation}
                    onChangeText={setPasswordConfirmation}
                    secureTextEntry
                  />
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <TouchableOpacity
                  onPress={resetPassword}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#22a366", "#157042"]}
                    style={styles.button}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Reset Password</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* STEP: SUCCESS */}
            {step === "success" && (
              <>
                <View style={styles.iconWrap}>
                  <Ionicons name="checkmark-circle" size={34} color="#1a8a52" />
                </View>
                <Text style={styles.title}>All Set!</Text>
                <Text style={styles.successText}>
                  Your password has been reset. You can now log in with your new
                  password.
                </Text>

                <TouchableOpacity
                  onPress={() => router.replace("/login")}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={["#22a366", "#157042"]}
                    style={styles.button}
                  >
                    <Text style={styles.buttonText}>Go to Login</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {step !== "success" && (
              <View style={styles.backRow}>
                <TouchableOpacity onPress={() => router.replace("/login")}>
                  <Text style={styles.backLink}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
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

  brand: { alignItems: "center", marginBottom: 24 },
  brandLogo: { width: 60, height: 60, marginBottom: 6 },
  brandName: { fontFamily: "Nunito_900Black", fontSize: 18, color: "#0e5c36" },
  brandAccent: { color: "#157042" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 28,
    alignItems: "center",
    shadowColor: "#005028",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },

  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "#f0faf5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Nunito_900Black",
    fontSize: 21,
    color: "#111",
    marginBottom: 4,
    textAlign: "center",
  },
  sub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "#9aaea6",
    marginBottom: 24,
    textAlign: "center",
  },
  successText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13.5,
    color: "#475569",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
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
    width: "100%",
  },
  inputIcon: {
    width: 46,
    height: 50,
    backgroundColor: "#f0faf5",
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1.5,
    borderRightColor: "#ddeee6",
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 14,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 14.5,
    color: "#1a1a1a",
  },
  otpInput: { textAlign: "center", letterSpacing: 4 },

  error: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    color: "#cc3333",
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "#ffd0d0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    width: "100%",
    textAlign: "center",
  },

  button: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1a8a52",
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  buttonText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 15,
    color: "#fff",
    letterSpacing: 0.2,
  },

  resendRow: { flexDirection: "row", justifyContent: "center", marginTop: 16 },
  resendText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    color: "#9aaea6",
  },
  resendLink: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12.5,
    color: "#1a8a52",
  },

  backRow: { marginTop: 20 },
  backLink: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 13,
    color: "#1a8a52",
  },
});
