import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import api, { formatMoney, getImageUrl } from "../services/api";

type GenderKey = "" | "male" | "female" | "prefer_not_to_say";

const AVATAR_COLORS = ["#1a8a52", "#059669", "#0284c7", "#7c3aed", "#db2777"];

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();

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

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [passSaving, setPassSaving] = useState(false);
  const [passSuccess, setPassSuccess] = useState("");
  const [passError, setPassError] = useState("");

  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");

  useEffect(() => {
    load();
  }, []);

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
        total_donated: donations
          .filter((d: any) => d.type === "monetary")
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

    if (!password) return setPassError("Please enter a new password.");
    if (password.length < 8)
      return setPassError("Password must be at least 8 characters.");
    if (password !== passwordConfirmation)
      return setPassError("Passwords do not match.");

    setPassSaving(true);
    try {
      await api.post("/donor/profile", {
        password,
        password_confirmation: passwordConfirmation,
      });
      setPassSuccess("Password updated successfully!");
      setPassword("");
      setPasswordConfirmation("");
      setTimeout(() => setPassSuccess(""), 3000);
    } catch (err: any) {
      setPassError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setPassSaving(false);
    }
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

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Email</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={user.email}
            editable={false}
          />
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
          <Text style={styles.formLabel}>New Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Min 8 characters"
            secureTextEntry
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
            placeholder="Repeat password"
            secureTextEntry
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
            <Text style={styles.dangerTitle}>Log out of all devices</Text>
            <Text style={styles.dangerDesc}>
              This will end all your active sessions.
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
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
