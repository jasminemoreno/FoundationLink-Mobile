import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PasswordChecklist, {
  isStrongPassword,
  PASSWORD_MIN_LENGTH,
  PasswordMatch,
} from "../components/PasswordChecklist";
import { useAuth } from "../context/AuthContext";
import api, { formatMoney, getImageUrl } from "../services/api";

type GenderKey = "" | "male" | "female" | "prefer_not_to_say";

const AVATAR_COLORS = ["#1a8a52", "#059669", "#0284c7", "#7c3aed", "#db2777"];

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, updateUser, user: authUser } = useAuth();
  const insets = useSafeAreaInsets();

  // Always holds the email currently stored in AuthContext, so the refresh
  // function below can compare against it without changing identity.
  const authEmailRef = useRef<string | undefined>(authUser?.email);
  authEmailRef.current = authUser?.email;

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>({});
  const [donorStats, setDonorStats] = useState({
    total_donations: 0,
    total_donated: 0,
  });

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<GenderKey>("");
  const [birthdate, setBirthdate] = useState("");
  const [address, setAddress] = useState("");

  const [infoSaving, setInfoSaving] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState("");
  const [infoError, setInfoError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passSaving, setPassSaving] = useState(false);
  const [passSuccess, setPassSuccess] = useState("");
  const [passError, setPassError] = useState("");

  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");

  /* ── EMAIL CHANGE ── */
  const [emailEditing, setEmailEditing] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");
  const [sendingEmailRequest, setSendingEmailRequest] = useState(false);
  const [cancellingEmail, setCancellingEmail] = useState(false);

  useEffect(() => {
    load();
  }, []);

  // Lightweight refresh: only touches email + pending_email, so it never
  // wipes anything the donor is typing in the other fields.
  const refreshEmailState = useCallback(async () => {
    try {
      const res = await api.get("/donor/profile");
      setUser((prev: any) => ({
        ...prev,
        email: res.data.email,
        pending_email: res.data.pending_email ?? null,
      }));

      if (
        authEmailRef.current &&
        res.data.email &&
        res.data.email !== authEmailRef.current
      ) {
        // The change was confirmed (in the browser) — sync the shared user
        // so the header and home screen use the new email too.
        await updateUser({ email: res.data.email });
        setEmailSuccess("Your email address has been updated.");
      }
    } catch (err) {
      console.error(err);
    }
  }, [updateUser]);

  // Refresh when this screen regains focus (skip the very first focus,
  // load() already fetched the profile).
  const skipFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (skipFirstFocus.current) {
        skipFirstFocus.current = false;
        return;
      }
      refreshEmailState();
    }, [refreshEmailState])
  );

  // The donor confirms the link in the phone browser, then switches back to
  // the app — the screen is still "focused", so listen for the app returning
  // to the foreground as well.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshEmailState();
    });
    return () => sub.remove();
  }, [refreshEmailState]);

  async function load() {
    setIsLoading(true);
    try {
      const [profileRes, donationsRes] = await Promise.all([
        api.get("/donor/profile"),
        api.get("/donor/donations"),
      ]);

      setUser(profileRes.data);

      const donations = Array.isArray(donationsRes.data)
        ? donationsRes.data
        : [];
      setDonorStats({
        total_donations: donations.length,
        // Same as the web: only money the foundation confirmed it received
        total_donated: donations
          .filter((d: any) => d.type === "monetary" && d.status === "received")
          .reduce((s: number, d: any) => s + Number(d.amount || 0), 0),
      });

      setFirstName(profileRes.data.first_name || "");
      setLastName(profileRes.data.last_name || "");
      setPhone(profileRes.data.phone || "");
      setGender(profileRes.data.gender || "");
      setBirthdate(
        profileRes.data.birthdate
          ? profileRes.data.birthdate.substring(0, 10)
          : ""
      );
      setAddress(profileRes.data.address || "");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveInfo() {
    setInfoSuccess("");
    setInfoError("");
    setInfoSaving(true);
    try {
      const res = await api.post("/donor/profile", {
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        gender: gender || null,
        birthdate: birthdate || null,
        address: address || null,
      });
      setUser(res.data.user);

      // sync the shared user so the header + home greeting update too
      await updateUser(res.data.user);

      setInfoSuccess("Profile updated successfully!");
      setTimeout(() => setInfoSuccess(""), 3000);
    } catch (err: any) {
      setInfoError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setInfoSaving(false);
    }
  }

  async function savePassword() {
    setPassSuccess("");
    setPassError("");

    if (!currentPassword)
      return setPassError("Please enter your current password.");
    if (!password) return setPassError("Please enter a new password.");
    if (!isStrongPassword(password))
      return setPassError(
        `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include a number and a special character.`
      );
    if (password !== passwordConfirmation)
      return setPassError("Passwords do not match.");

    setPassSaving(true);
    try {
      await api.post("/donor/profile", {
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      });
      setPassSuccess("Password updated successfully!");
      setCurrentPassword("");
      setPassword("");
      setPasswordConfirmation("");
      setTimeout(() => setPassSuccess(""), 3000);
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      setPassError(
        errors
          ? Object.values(errors).flat().join(" · ")
          : err.response?.data?.message || "Failed to update password."
      );
    } finally {
      setPassSaving(false);
    }
  }

  /* ── EMAIL CHANGE ── */
  function closeEmailEdit() {
    setEmailEditing(false);
    setNewEmail("");
    setEmailPassword("");
    setShowEmailPassword(false);
    setEmailError("");
  }

  async function requestEmailChange() {
    setEmailError("");
    setEmailSuccess("");

    if (!newEmail.trim()) {
      return setEmailError("Please enter a new email address.");
    }
    if (!emailPassword) {
      return setEmailError("Please enter your current password.");
    }

    setSendingEmailRequest(true);
    try {
      const res = await api.post("/donor/profile/email/request", {
        new_email: newEmail.trim(),
        current_password: emailPassword,
      });
      setUser((prev: any) => ({
        ...prev,
        pending_email: res.data.pending_email,
      }));
      setEmailSuccess(res.data.message);
      closeEmailEdit();
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      setEmailError(
        errors
          ? Object.values(errors).flat().join(" · ")
          : err.response?.data?.message || "Failed to request email change."
      );
    } finally {
      setSendingEmailRequest(false);
    }
  }

  async function cancelPendingEmail() {
    setCancellingEmail(true);
    try {
      await api.post("/donor/profile/email/cancel");
      setUser((prev: any) => ({ ...prev, pending_email: null }));
      setEmailSuccess("");
    } catch (err) {
      console.error("Failed to cancel pending email change:", err);
    } finally {
      setCancellingEmail(false);
    }
  }

  // Profile is outside the tabs, so nothing redirects by itself after logout
  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  async function pickPhoto() {
    if (photoUploading) return;
    setPhotoError("");

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhotoError("Photo library permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("profile_photo", {
        uri: result.assets[0].uri,
        name: "profile.jpg",
        type: "image/jpeg",
      } as any);

      const res = await api.post("/donor/profile/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(res.data.user);

      // sync the shared user so the header avatar updates too
      await updateUser(res.data.user);
    } catch (err: any) {
      setPhotoError(err.response?.data?.message || "Failed to upload photo.");
    } finally {
      setPhotoUploading(false);
    }
  }

  const initials =
    `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() ||
    "D";
  const avatarColor = AVATAR_COLORS[(user.id ?? 1) % AVATAR_COLORS.length];
  const photoUrl = getImageUrl(user.profile_photo);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a8a52" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0F2D52" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.sub}>Manage your account information</Text>
        </View>
      </View>

      {/* AVATAR CARD */}
      <View style={styles.avatarCard}>
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={pickPhoto}
          disabled={photoUploading}
        >
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatarImg} />
          ) : (
            <View
              style={[styles.avatarCircle, { backgroundColor: avatarColor }]}
            >
              <Text style={styles.avatarCircleText}>{initials}</Text>
            </View>
          )}
          <View style={styles.avatarOverlay}>
            {photoUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera-outline" size={18} color="#fff" />
            )}
          </View>
        </TouchableOpacity>

        {photoError ? (
          <Text style={styles.photoErrorText}>{photoError}</Text>
        ) : null}

        <Text style={styles.avatarName}>
          {user.first_name} {user.last_name}
        </Text>
        <Text style={styles.avatarEmail}>{user.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Donor</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{donorStats.total_donations}</Text>
            <Text style={styles.statLabel}>Donations</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>
              ₱{formatMoney(donorStats.total_donated)}
            </Text>
            <Text style={styles.statLabel}>Contributed</Text>
          </View>
        </View>
      </View>

      {/* QUICK LINKS */}
      <View style={styles.quickLinks}>
        <TouchableOpacity
          style={styles.qlItem}
          onPress={() => router.push("/my-donations")}
        >
          <Ionicons name="heart-outline" size={16} color="#9caba3" />
          <Text style={styles.qlText}>My Donations</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.qlItem}
          onPress={() => router.push("/campaigns")}
        >
          <Ionicons name="megaphone-outline" size={16} color="#9caba3" />
          <Text style={styles.qlText}>Browse Campaigns</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.qlItem}
          onPress={() => router.push("/notifications")}
        >
          <Ionicons name="notifications-outline" size={16} color="#9caba3" />
          <Text style={styles.qlText}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.qlItem}
          onPress={() => router.push("/help")}
        >
          <Ionicons name="help-circle-outline" size={16} color="#9caba3" />
          <Text style={styles.qlText}>Help Center</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.qlItem}
          onPress={() => router.push("/terms")}
        >
          <Ionicons name="document-text-outline" size={16} color="#9caba3" />
          <Text style={styles.qlText}>Terms of Service</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.qlItem}
          onPress={() => router.push("/privacy")}
        >
          <Ionicons name="lock-closed-outline" size={16} color="#9caba3" />
          <Text style={styles.qlText}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.qlItem, styles.qlItemLast]}
          onPress={() => router.push("/contact")}
        >
          <Ionicons name="mail-outline" size={16} color="#9caba3" />
          <Text style={styles.qlText}>Contact Us</Text>
        </TouchableOpacity>
      </View>

      {/* PERSONAL INFO */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Personal Information</Text>

        <View style={styles.formRow}>
          <View style={styles.formGroupHalf}>
            <Text style={styles.formLabel}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="First name"
            />
          </View>
          <View style={styles.formGroupHalf}>
            <Text style={styles.formLabel}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Last name"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Gender</Text>
          <View style={styles.chipRow}>
            {(
              [
                { key: "prefer_not_to_say", label: "Prefer not to say" },
                { key: "male", label: "Male" },
                { key: "female", label: "Female" },
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
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Birthdate</Text>
          <TextInput
            style={styles.input}
            value={birthdate}
            onChangeText={setBirthdate}
            placeholder="YYYY-MM-DD"
          />
        </View>

        {/* EMAIL (with change-verification flow) */}
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Email</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={user.email}
            editable={false}
          />

          {/* pending change awaiting confirmation */}
          {user.pending_email ? (
            <View style={styles.emailPending}>
              <Ionicons
                name="time-outline"
                size={15}
                color="#0e5c36"
                style={{ marginTop: 1 }}
              />
              <Text style={styles.emailPendingText}>
                Verification sent to{" "}
                <Text style={styles.emailPendingStrong}>
                  {user.pending_email}
                </Text>{" "}
                — check that inbox to confirm.
              </Text>
              <TouchableOpacity
                onPress={cancelPendingEmail}
                disabled={cancellingEmail}
              >
                {cancellingEmail ? (
                  <ActivityIndicator size="small" color="#0e5c36" />
                ) : (
                  <Text style={styles.emailPendingCancel}>Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : !emailEditing ? (
            <>
              <TouchableOpacity
                style={styles.changeEmailBtn}
                onPress={() => {
                  setEmailSuccess("");
                  setEmailEditing(true);
                }}
              >
                <Ionicons name="mail-outline" size={15} color="#1a8a52" />
                <Text style={styles.changeEmailBtnText}>Change email</Text>
              </TouchableOpacity>
              <Text style={styles.fieldHint}>
                Changing your email requires confirming a link sent to the new
                address before it takes effect.
              </Text>
            </>
          ) : (
            <View style={styles.emailEditBox}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>New Email</Text>
                <TextInput
                  style={styles.input}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder="new.email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Current Password</Text>
                <View style={styles.pwWrap}>
                  <TextInput
                    style={[styles.input, styles.inputWithToggle]}
                    value={emailPassword}
                    onChangeText={setEmailPassword}
                    secureTextEntry={!showEmailPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.pwToggle}
                    onPress={() => setShowEmailPassword((v) => !v)}
                  >
                    <Ionicons
                      name={
                        showEmailPassword ? "eye-off-outline" : "eye-outline"
                      }
                      size={18}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}

              <View style={styles.emailEditActions}>
                <TouchableOpacity
                  style={styles.cancelSmBtn}
                  onPress={closeEmailEdit}
                >
                  <Text style={styles.cancelSmBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveSmBtn}
                  onPress={requestEmailChange}
                  disabled={sendingEmailRequest}
                >
                  {sendingEmailRequest ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveSmBtnText}>
                      Send Verification Link
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {emailSuccess ? (
            <Text style={[styles.successText, { marginTop: 10 }]}>
              {emailSuccess}
            </Text>
          ) : null}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Address</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Your address"
          />
        </View>

        {infoSuccess ? (
          <Text style={styles.successText}>{infoSuccess}</Text>
        ) : null}
        {infoError ? <Text style={styles.errorText}>{infoError}</Text> : null}

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={saveInfo}
          disabled={infoSaving}
        >
          {infoSaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* CHANGE PASSWORD */}
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Change Password</Text>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={(v) => {
              setCurrentPassword(v);
              setPassError("");
            }}
            placeholder="Enter your current password"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>New Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              setPassError("");
            }}
            placeholder={`At least ${PASSWORD_MIN_LENGTH} characters`}
            secureTextEntry
            autoCapitalize="none"
          />
          <PasswordChecklist password={password} />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={passwordConfirmation}
            onChangeText={(v) => {
              setPasswordConfirmation(v);
              setPassError("");
            }}
            placeholder="Repeat password"
            secureTextEntry
            autoCapitalize="none"
          />
          <PasswordMatch
            password={password}
            confirmation={passwordConfirmation}
          />
        </View>

        {passSuccess ? (
          <Text style={styles.successText}>{passSuccess}</Text>
        ) : null}
        {passError ? <Text style={styles.errorText}>{passError}</Text> : null}

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={savePassword}
          disabled={passSaving}
        >
          {passSaving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* DANGER ZONE */}
      <View style={[styles.panel, styles.dangerPanel]}>
        <Text style={[styles.panelTitle, { color: "#dc2626" }]}>Account</Text>
        <View style={styles.dangerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.dangerTitle}>Log out</Text>
            <Text style={styles.dangerDesc}>
              This will sign you out of FoundationLink on this device.
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#c8f0e0" },
  content: { padding: 16, paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#c8f0e0",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  title: { fontFamily: "Nunito_900Black", fontSize: 18, color: "#0e5c36" },
  sub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11.5,
    color: "#475569",
    marginTop: 1,
  },

  avatarCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#005028",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    marginBottom: 12,
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarCircle: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarCircleText: {
    fontFamily: "Nunito_900Black",
    fontSize: 24,
    color: "#fff",
  },
  avatarOverlay: {
    position: "absolute",
    inset: 0 as any,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  photoErrorText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11,
    color: "#dc2626",
    marginBottom: 8,
  },

  avatarName: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 15,
    color: "#0F2D52",
  },
  avatarEmail: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 3,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: "#f0fdf4",
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  roleBadgeText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 11,
    color: "#1a8a52",
  },

  statsRow: { flexDirection: "row", gap: 10, marginTop: 16, width: "100%" },
  statBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  statVal: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 15,
    color: "#0F2D52",
  },
  statLabel: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 2,
  },

  quickLinks: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#005028",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  qlItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  qlItemLast: { borderBottomWidth: 0 },
  qlText: { fontFamily: "Nunito_600SemiBold", fontSize: 13, color: "#475569" },

  panel: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#005028",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  panelTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 14,
    color: "#0F2D52",
    marginBottom: 14,
  },

  formRow: { flexDirection: "row", gap: 10 },
  formGroup: { marginBottom: 14 },
  formGroupHalf: { flex: 1, marginBottom: 14 },
  formLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: "#475569",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "#1a1a1a",
  },
  disabledInput: { backgroundColor: "#f8fafc", color: "#94a3b8" },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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

  successText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: "#059669",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: "#cc3333",
    backgroundColor: "#fff5f5",
    borderWidth: 1,
    borderColor: "#ffd0d0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },

  saveBtn: {
    backgroundColor: "#1a8a52",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  saveBtnText: { fontFamily: "Nunito_700Bold", fontSize: 13, color: "#fff" },

  /* EMAIL CHANGE */
  fieldHint: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 6,
  },
  changeEmailBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    backgroundColor: "#f0fdf4",
  },
  changeEmailBtnText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12.5,
    color: "#1a8a52",
  },
  emailPending: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 8,
    padding: 10,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 10,
  },
  emailPendingText: {
    flex: 1,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: "#0e5c36",
    lineHeight: 18,
  },
  emailPendingStrong: { fontFamily: "Nunito_800ExtraBold" },
  emailPendingCancel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: "#0e5c36",
  },
  emailEditBox: {
    marginTop: 12,
    padding: 14,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
  },
  pwWrap: { position: "relative", justifyContent: "center" },
  inputWithToggle: { paddingRight: 44 },
  pwToggle: {
    position: "absolute",
    right: 10,
    padding: 4,
  },
  emailEditActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  cancelSmBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelSmBtnText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: "#64748b",
  },
  saveSmBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#1a8a52",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 150,
    minHeight: 36,
  },
  saveSmBtnText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: "#fff",
  },

  dangerPanel: { backgroundColor: "#fff" },
  dangerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  dangerTitle: {
    fontFamily: "Nunito_700Bold",
    fontSize: 13,
    color: "#dc2626",
    marginBottom: 3,
  },
  dangerDesc: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11.5,
    color: "#94a3b8",
  },
  logoutBtn: {
    borderWidth: 1.5,
    borderColor: "#dc2626",
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  logoutBtnText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12.5,
    color: "#dc2626",
  },
});
