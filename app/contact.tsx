import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ContactScreen() {
  const router = useRouter();

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0F2D52" />
        </TouchableOpacity>
        <Text style={styles.title}>Contact Us</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sub}>
          We are here to help with any questions or concerns.
        </Text>

        <View style={[styles.card, styles.cardMain]}>
          <Text style={styles.icon}>📧</Text>
          <Text style={styles.cardTitle}>Email Support</Text>
          <Text style={styles.cardDesc}>
            The fastest way to reach our team. We aim to respond within 1-2
            business days.
          </Text>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => Linking.openURL("mailto:support@foundationlink.com")}
          >
            <Text style={styles.btnPrimaryText}>
              support@foundationlink.com
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.icon}>🔍</Text>
          <Text style={styles.cardTitle}>Check the Help Center first</Text>
          <Text style={styles.cardDesc}>
            Many common questions about donations, campaigns, and your account
            are already answered there.
          </Text>
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => router.push("/help")}
          >
            <Text style={styles.btnSecondaryText}>Visit Help Center</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color="#92400e"
          />
          <Text style={styles.noticeText}>
            Phone support and social media pages are not yet available. Email is
            currently the best way to reach us.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#c8f0e0" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9f5ee",
  },
  title: { fontFamily: "Nunito_900Black", fontSize: 17, color: "#0e5c36" },
  content: { padding: 16, paddingBottom: 40 },
  sub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    color: "#475569",
    textAlign: "center",
    marginBottom: 18,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#005028",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardMain: { borderWidth: 2, borderColor: "#1a8a52" },
  icon: { fontSize: 32, marginBottom: 10 },
  cardTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 15,
    color: "#0F2D52",
    marginBottom: 6,
  },
  cardDesc: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 16,
  },

  btnPrimary: {
    backgroundColor: "#1a8a52",
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 11,
  },
  btnPrimaryText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12.5,
    color: "#fff",
  },
  btnSecondary: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#1a8a52",
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: 11,
  },
  btnSecondaryText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12.5,
    color: "#1a8a52",
  },

  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#fefce8",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  noticeText: {
    flex: 1,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: "#92400e",
    lineHeight: 18,
  },
});
