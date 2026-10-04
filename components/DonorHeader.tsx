import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  AppState,
  Image,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import api, { getImageUrl } from "../services/api";
import ProfileDropdown from "./ProfileDropdown";

// How often the badge re-checks the server while the app is open.
const POLL_INTERVAL_MS = 30000;

export default function DonorHeader() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await api.get("/donor/notifications/count");
      setUnreadCount(res.data.count ?? 0);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Refetch every time the tabs group comes back into focus — e.g.
  // returning from Notifications or Profile. This does NOT fire when
  // switching between tabs, or when a new notification arrives while
  // you're sitting on a tab, which is why polling is added below.
  useFocusEffect(
    useCallback(() => {
      loadUnreadCount();
    }, [loadUnreadCount])
  );

  // Keep the badge live while the app is open:
  //  - fetch as soon as the logged-in user is known (the first fetch
  //    can fire before the token is ready and silently fail)
  //  - poll every 30s
  //  - refetch immediately when the app returns from the background
  // The profile (name/photo) is also refreshed on open and when the app
  // returns to the foreground, so changes made on the web show up here.
  useEffect(() => {
    if (!user) return;

    loadUnreadCount();
    refreshUser();

    const interval = setInterval(() => {
      if (AppState.currentState === "active") {
        loadUnreadCount();
      }
    }, POLL_INTERVAL_MS);

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        loadUnreadCount();
        refreshUser();
      }
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [user?.id, loadUnreadCount, refreshUser]);

  async function onNotifPress() {
    setUnreadCount(0);
    router.push("/notifications");
    try {
      await api.post("/donor/notifications/seen");
    } catch (err) {
      console.error(err);
    }
  }

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()
    : "D";

  const photoUrl = getImageUrl((user as any)?.profile_photo);

  function onHeaderLayout(e: LayoutChangeEvent) {
    setHeaderHeight(e.nativeEvent.layout.height);
  }

  return (
    <View
      style={[styles.header, { paddingTop: insets.top + 8 }]}
      onLayout={onHeaderLayout}
    >
      <View style={styles.brand}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View>
          <Text style={styles.brandName}>
            Foundation<Text style={styles.brandAccent}>Link</Text>
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.notifBtn} onPress={onNotifPress}>
          <Ionicons name="notifications-outline" size={19} color="#1a8a52" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setDropdownVisible(true)}>
          <View style={styles.avatar}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <ProfileDropdown
        visible={dropdownVisible}
        user={user}
        topOffset={headerHeight}
        onClose={() => setDropdownVisible(false)}
        onProfile={() => router.push("/profile")}
        onDonations={() => router.push("/my-donations")}
        onLogout={logout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderBottomWidth: 1,
    borderBottomColor: "#e9f5ee",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  logo: { width: 30, height: 30 },
  brandName: { fontFamily: "Nunito_900Black", fontSize: 15, color: "#1a8a52" },
  brandAccent: { color: "#3b82f6" },

  actions: { flexDirection: "row", alignItems: "center", gap: 12 },

  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 20,
    backgroundColor: "#dc2626",
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { fontFamily: "Nunito_800ExtraBold", fontSize: 9, color: "#fff" },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#1a8a52",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12,
    color: "#fff",
  },
});
