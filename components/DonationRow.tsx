import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { formatDate, formatMoney } from "../services/api";
import { Donation } from "../types/donortypes";

const STATUS_STYLES: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  pending: { bg: "#fefce8", color: "#92400e", label: "Pending" },
  received: { bg: "#f0fdf4", color: "#059669", label: "Received" },
  cancelled: { bg: "#fef2f2", color: "#dc2626", label: "Cancelled" },
};

export default function DonationRow({ donation }: { donation: Donation }) {
  const statusStyle = STATUS_STYLES[donation.status] ?? STATUS_STYLES.pending;

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor:
              donation.type === "monetary" ? "#f0fdf4" : "#eff6ff",
          },
        ]}
      >
        <Ionicons
          name={donation.type === "monetary" ? "cash-outline" : "cube-outline"}
          size={18}
          color={donation.type === "monetary" ? "#059669" : "#3b82f6"}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.campaign} numberOfLines={1}>
          {donation.campaign.title}
        </Text>
        <Text style={styles.amount}>
          {donation.type === "monetary"
            ? `₱${formatMoney(donation.amount)}`
            : `${donation.item_name} × ${donation.item_quantity}`}
        </Text>
      </View>

      <View style={styles.right}>
        <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.color }]}>
            {statusStyle.label}
          </Text>
        </View>
        <Text style={styles.date}>{formatDate(donation.donated_at)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  info: { flex: 1 },
  campaign: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 13,
    color: "#0F2D52",
  },
  amount: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11.5,
    color: "#64748b",
    marginTop: 1,
  },
  right: { alignItems: "flex-end" },
  statusPill: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 20,
    marginBottom: 3,
  },
  statusText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 9.5,
    textTransform: "capitalize",
  },
  date: { fontFamily: "Nunito_600SemiBold", fontSize: 10, color: "#94a3b8" },
});
