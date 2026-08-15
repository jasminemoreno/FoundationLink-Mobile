import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
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

type GenderKey = "" | "male" | "female" | "prefer_not_to_say";

export default function RegisterScreen() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<GenderKey>("");
  const [birthdate, setBirthdate] = useState("");
  const [address, setAddress] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const strength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength] || "";
  const strengthColor =
    ["", "#dc2626", "#ca8a04", "#2db870", "#059669"][strength] || "#e2e8f0";

  const genderLabel =
    (
      {
        male: "Male",
        female: "Female",
        prefer_not_to_say: "Prefer not to say",
      } as Record<string, string>
    )[gender] || "—";

  function nextStep() {
    setStepError("");

    if (step === 1) {
      if (!firstName.trim()) return setStepError("First name is required.");
      if (!lastName.trim()) return setStepError("Last name is required.");
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!email.trim()) return setStepError("Email is required.");
      if (!password) return setStepError("Password is required.");
      if (password.length < 8)
        return setStepError("Password must be at least 8 characters.");
      if (password !== passwordConfirmation)
        return setStepError("Passwords do not match.");
      setStep(3);
      return;
    }
  }

  async function register() {
    setStepError("");
    if (!agreedToTerms) {
      setStepError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/register/donor", {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        password_confirmation: passwordConfirmation,
        phone: phone || null,
        address: address || null,
        gender: gender || null,
        birthdate: birthdate || null,
      });
      router.replace("/login");
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      setStepError(
        errors
          ? Object.values(errors).flat().join(" · ")
          : err.response?.data?.message || "Registration failed."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.page} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create an Account</Text>
        <Text style={styles.sub}>Sign Up to get started</Text>

        {/* STEP INDICATOR */}
        <View style={styles.stepsWrap}>
          <View style={styles.stepTrack}>
            <View
              style={[styles.stepCircle, step >= 1 && styles.stepCircleActive]}
            >
              <Text
                style={[
                  styles.stepCircleText,
                  step >= 1 && styles.stepCircleTextActive,
                ]}
              >
                {step > 1 ? "✓" : "1"}
              </Text>
            </View>
            <View
              style={[
                styles.stepConnector,
                step > 1 && styles.stepConnectorActive,
              ]}
            />
            <View
              style={[styles.stepCircle, step >= 2 && styles.stepCircleActive]}
            >
              <Text
                style={[
                  styles.stepCircleText,
                  step >= 2 && styles.stepCircleTextActive,
                ]}
              >
                {step > 2 ? "✓" : "2"}
              </Text>
            </View>
            <View
              style={[
                styles.stepConnector,
                step > 2 && styles.stepConnectorActive,
              ]}
            />
            <View
              style={[styles.stepCircle, step >= 3 && styles.stepCircleActive]}
            >
              <Text
                style={[
                  styles.stepCircleText,
                  step >= 3 && styles.stepCircleTextActive,
                ]}
              >
                3
              </Text>
            </View>
          </View>
          <View style={styles.stepLabels}>
            <Text
              style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}
            >
              Personal
            </Text>
            <Text
              style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}
            >
              Account
            </Text>
            <Text
              style={[styles.stepLabel, step >= 3 && styles.stepLabelActive]}
            >
              Confirm
            </Text>
          </View>
        </View>

        {/* STEP 1: PERSONAL */}
        {step === 1 && (
          <View>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.half]}
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
              />
              <TextInput
                style={[styles.input, styles.half]}
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.chipRow}>
              {(
                [
                  { key: "male", label: "Male" },
                  { key: "female", label: "Female" },
                  { key: "prefer_not_to_say", label: "Prefer not to say" },
                ] as { key: GenderKey; label: string }[]
              ).map((g) => (
                <TouchableOpacity
                  key={g.key}
                  style={[styles.chip, gender === g.key && styles.chipActive]}
                  onPress={() => setGender(g.key)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      gender === g.key && styles.chipTextActive,
                    ]}
                  >
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Birthdate (YYYY-MM-DD)"
              value={birthdate}
              onChangeText={setBirthdate}
            />

            <TextInput
              style={styles.input}
              placeholder="Address"
              value={address}
              onChangeText={setAddress}
            />

            {stepError ? <Text style={styles.error}>{stepError}</Text> : null}

            <TouchableOpacity style={styles.btnNext} onPress={nextStep}>
              <Text style={styles.btnNextText}>Next</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: ACCOUNT */}
        {step === 2 && (
          <View>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <View style={styles.passWrap}>
              <TextInput
                style={styles.passInput}
                placeholder="Password (min 8 characters)"
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPass(!showPass)}
              >
                <Ionicons
                  name={showPass ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.passWrap}>
              <TextInput
                style={styles.passInput}
                placeholder="Confirm password"
                secureTextEntry={!showConfirm}
                value={passwordConfirmation}
                onChangeText={setPasswordConfirmation}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowConfirm(!showConfirm)}
              >
                <Ionicons
                  name={showConfirm ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>

            {password ? (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        strength >= i && { backgroundColor: strengthColor },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strengthColor }]}>
                  {strengthLabel}
                </Text>
              </View>
            ) : null}

            {stepError ? <Text style={styles.error}>{stepError}</Text> : null}

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.btnBack}
                onPress={() => setStep(1)}
              >
                <Text style={styles.btnBackText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnNextFlex} onPress={nextStep}>
                <Text style={styles.btnNextText}>Next</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: CONFIRM */}
        {step === 3 && (
          <View>
            <View style={styles.confirmCard}>
              <View style={styles.confirmAvatar}>
                <Text style={styles.confirmAvatarText}>
                  {firstName[0]}
                  {lastName[0]}
                </Text>
              </View>
              <Text style={styles.confirmName}>
                {firstName} {lastName}
              </Text>
              <Text style={styles.confirmEmail}>{email}</Text>
            </View>

            <View style={styles.confirmGrid}>
              <View style={styles.confirmGridItem}>
                <Text style={styles.confirmGridLabel}>Phone</Text>
                <Text style={styles.confirmGridValue}>{phone || "—"}</Text>
              </View>
              <View style={styles.confirmGridItem}>
                <Text style={styles.confirmGridLabel}>Gender</Text>
                <Text style={styles.confirmGridValue}>{genderLabel}</Text>
              </View>
              <View style={styles.confirmGridItem}>
                <Text style={styles.confirmGridLabel}>Birthdate</Text>
                <Text style={styles.confirmGridValue}>{birthdate || "—"}</Text>
              </View>
              <View style={styles.confirmGridItem}>
                <Text style={styles.confirmGridLabel}>Address</Text>
                <Text style={styles.confirmGridValue}>{address || "—"}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
            >
              <View
                style={[
                  styles.checkbox,
                  agreedToTerms && styles.checkboxActive,
                ]}
              >
                {agreedToTerms && (
                  <Ionicons name="checkmark" size={13} color="#fff" />
                )}
              </View>
              <Text style={styles.termsText}>
                I agree to the{" "}
                <Text
                  style={styles.termsLink}
                  onPress={() => router.push("/terms")}
                >
                  Terms of Service
                </Text>{" "}
                and{" "}
                <Text
                  style={styles.termsLink}
                  onPress={() => router.push("/privacy")}
                >
                  Privacy Policy
                </Text>
              </Text>
            </TouchableOpacity>

            {stepError ? <Text style={styles.error}>{stepError}</Text> : null}

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.btnBack}
                onPress={() => setStep(2)}
              >
                <Text style={styles.btnBackText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.btnSignup,
                  (isLoading || !agreedToTerms) && styles.btnDisabled,
                ]}
                onPress={register}
                disabled={isLoading || !agreedToTerms}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnSignupText}>Sign Up</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace("/login")}>
            <Text style={styles.loginLink}>Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },

  title: {
    fontFamily: "Nunito_900Black",
    fontSize: 22,
    color: "#111",
    textAlign: "center",
    marginBottom: 4,
  },
  sub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "#9aaea6",
    textAlign: "center",
    marginBottom: 24,
  },

  stepsWrap: { marginBottom: 28 },
  stepTrack: { flexDirection: "row", alignItems: "center" },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  stepCircleActive: { backgroundColor: "#1a8a52" },
  stepCircleText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12.5,
    color: "#94a3b8",
  },
  stepCircleTextActive: { color: "#fff" },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 6,
  },
  stepConnectorActive: { backgroundColor: "#1a8a52" },
  stepLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingHorizontal: 2,
  },
  stepLabel: { fontFamily: "Nunito_700Bold", fontSize: 11, color: "#94a3b8" },
  stepLabelActive: { color: "#1a8a52" },

  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  input: {
    borderWidth: 1.5,
    borderColor: "#ddeee6",
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 14,
    color: "#1a1a1a",
    marginBottom: 14,
  },

  fieldLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12.5,
    color: "#475569",
    marginBottom: 8,
    marginTop: -2,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  chipActive: { backgroundColor: "#1a8a52", borderColor: "#1a8a52" },
  chipText: { fontFamily: "Nunito_700Bold", fontSize: 12, color: "#64748b" },
  chipTextActive: { color: "#fff" },

  passWrap: { position: "relative", marginBottom: 14 },
  passInput: {
    borderWidth: 1.5,
    borderColor: "#ddeee6",
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
    paddingRight: 44,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 14,
    color: "#1a1a1a",
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: 0,
    height: 48,
    justifyContent: "center",
  },

  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  strengthBars: { flexDirection: "row", gap: 4 },
  strengthBar: {
    width: 34,
    height: 4,
    borderRadius: 99,
    backgroundColor: "#e2e8f0",
  },
  strengthLabel: { fontFamily: "Nunito_700Bold", fontSize: 12 },

  error: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    color: "#cc3333",
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "#ffd0d0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },

  btnRow: { flexDirection: "row", gap: 12 },
  btnBack: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  btnBackText: { fontFamily: "Nunito_700Bold", fontSize: 14, color: "#64748b" },

  btnNext: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#1a8a52",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnNextFlex: {
    flex: 2,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#1a8a52",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnNextText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 14,
    color: "#fff",
  },

  btnSignup: {
    flex: 2,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#1a8a52",
    justifyContent: "center",
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnSignupText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 14,
    color: "#fff",
  },

  confirmCard: {
    backgroundColor: "#f0faf5",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  confirmAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#1a8a52",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  confirmAvatarText: {
    fontFamily: "Nunito_900Black",
    fontSize: 18,
    color: "#fff",
    textTransform: "uppercase",
  },
  confirmName: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 14.5,
    color: "#0F2D52",
  },
  confirmEmail: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
  },

  confirmGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  confirmGridItem: { width: "45%" },
  confirmGridLabel: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 9.5,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  confirmGridValue: {
    fontFamily: "Nunito_700Bold",
    fontSize: 13,
    color: "#0F2D52",
    marginTop: 2,
  },

  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 18,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  checkboxActive: { backgroundColor: "#1a8a52", borderColor: "#1a8a52" },
  termsText: {
    flex: 1,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    color: "#64748b",
    lineHeight: 19,
  },
  termsLink: { fontFamily: "Nunito_700Bold", color: "#1a8a52" },

  loginRow: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  loginText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "#9aaea6",
  },
  loginLink: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 13,
    color: "#1a8a52",
  },
});
