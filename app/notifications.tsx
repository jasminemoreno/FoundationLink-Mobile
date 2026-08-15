import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import EmptyState from "../components/EmptyState";
import api, { formatDateTime } from "../services/api";

type NotifType = "success" | "warning" | "info";

type Notification = {
  id: number;
  type: NotifType;
  title: string;
  message: string;
  date: string;
  read: boolean;
  link: string | null;
};

const ICONS: Record<NotifType, keyof typeof Ionicons.glyphMap> = {
  success: "checkmark-circle",
  warning: "alert-circle",
  info: "megaphone",
};

const ICON_COLORS: Record<NotifType, string> = {
  success: "#059669",
  warning: "#ca8a04",
  info: "#3b82f6",
};

const ICON_BG: Record<NotifType, string> = {
  success: "#f0fdf4",
  warning: "#fefce8",
  info: "#eff6ff",
};

// Maps the web app's link paths to the closest equivalent mobile route.
// Highlight-scrolling (?highlight=123) isn't supported on mobile yet.
function resolveMobileRoute(link: string | null): string | null {
  if (!link) return null;
  if (link.startsWith("/donor/campaigns")) return "/campaigns";
  if (link.startsWith("/donor/donations")) return "/my-donations";
  return null;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      const res = await api.get("/donor/notifications");
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setNotifications([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  async function openNotification(n: Notification) {
    if (!n.read) {
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
      try {
        await api.post(`/donor/notifications/${n.id}/read`);
      } catch (err) {
        console.error(err);
      }
    }
    const route = resolveMobileRoute(n.link);
    if (route) router.push(route as any);
  }

  async function deleteNotification(n: Notification) {
    const prev = notifications;
    setNotifications((current) => current.filter((x) => x.id !== n.id));
    try {
      await api.delete(`/donor/notifications/${n.id}`);
    } catch (err) {
      console.error(err);
      setNotifications(prev);
    }
  }

  function confirmClearAll() {
    if (notifications.length === 0) return;
    Alert.alert(
      "Clear all notifications?",
      "This will permanently remove all your notifications. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear all", style: "destructive", onPress: clearAll },
      ]
    );
  }

  async function clearAll() {
    setClearing(true);
    try {
      await api.delete("/donor/notifications");
      setNotifications([]);
    } catch (err) {
      console.error(err);
    } finally {
      setClearing(false);
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0F2D52" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.sub}>Stay updated on your donations</Text>
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={confirmClearAll}
            disabled={clearing}
          >
            {clearing ? (
              <ActivityIndicator size="small" color="#64748b" />
            ) : (
              <Text style={styles.clearBtnText}>Clear all</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1a8a52"
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#1a8a52" />
          </View>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="notifications-outline"
            message="No notifications yet."
          />
        ) : (
          <View style={{ gap: 10 }}>
            {notifications.map((n) => (
              <View
                key={n.id}
                style={[styles.card, !n.read && styles.cardUnread]}
              >
                <TouchableOpacity
                  style={styles.clickzone}
                  activeOpacity={resolveMobileRoute(n.link) ? 0.7 : 1}
                  onPress={() => openNotification(n)}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: ICON_BG[n.type] },
                    ]}
                  >
                    <Ionicons
                      name={ICONS[n.type]}
                      size={18}
                      color={ICON_COLORS[n.type]}
                    />
                  </View>
                  <View style={styles.body}>
                    <Text style={styles.notifTitle}>{n.title}</Text>
                    <Text style={styles.notifMessage}>{n.message}</Text>
                    <Text style={styles.notifDate}>
                      {formatDateTime(n.date)}
                    </Text>
                  </View>
                  {!n.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteNotification(n)}
                >
                  <Ionicons name="close" size={16} color="#cbd5e1" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#c8f0e0" },
  content: { padding: 16, paddingBottom: 40 },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9f5ee",
  },
  title: { fontFamily: "Nunito_900Black", fontSize: 18, color: "#0e5c36" },
  sub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11.5,
    color: "#475569",
    marginTop: 1,
  },
  clearBtn: {
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  clearBtnText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 11.5,
    color: "#64748b",
  },

  loadingWrap: { padding: 60, alignItems: "center" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "stretch",
    borderLeftWidth: 4,
    borderLeftColor: "transparent",
    shadowColor: "#005028",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardUnread: { borderLeftColor: "#1a8a52", backgroundColor: "#f0fdf4" },

  clickzone: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  body: { flex: 1 },
  notifTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 13,
    color: "#0F2D52",
    marginBottom: 3,
  },
  notifMessage: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: "#475569",
    lineHeight: 17,
    marginBottom: 5,
  },
  notifDate: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 10.5,
    color: "#94a3b8",
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1a8a52",
    marginTop: 3,
  },

  deleteBtn: { width: 38, justifyContent: "center", alignItems: "center" },
});
