import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { formatDate, formatMoney, getImageUrl } from "../services/api";
import type { Campaign } from "../types/donortypes";

export type PaymentMethod = NonNullable<
  Campaign["accepted_payment_methods"]
>[number];
export type CampaignStatus = Campaign["status"];

type Props = {
  visible: boolean;
  campaign: Campaign | null;
  onClose: () => void;
  onDonate: (campaign: Campaign) => void;
};

const STATUS_LABEL: Record<CampaignStatus, string> = {
  active: "🟢 Active",
  completed: "✅ Completed",
  paused: "⏸ Paused",
  cancelled: "❌ Cancelled",
  draft: "📝 Draft",
};

function statusLabel(s: CampaignStatus): string {
  return STATUS_LABEL[s] ?? s;
}

export default function CampaignDetailsModal({
  visible,
  campaign,
  onClose,
  onDonate,
}: Props) {
  if (!campaign) return null;

  const percent = campaign.percent;
  const coverUri = getImageUrl(campaign.cover_photo) ?? undefined;

  const statusBgStyle = STATUS_BG[campaign.status];
  const statusTextStyle = STATUS_TEXT[campaign.status];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* HEAD */}
          <View style={styles.head}>
            <Text style={styles.headTitle}>Campaign Details</Text>
            <TouchableOpacity style={styles.btnClose} onPress={onClose}>
              <Ionicons name="close" size={16} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* COVER */}
            <View style={styles.cover}>
              {coverUri ? (
                <Image source={{ uri: coverUri }} style={styles.coverImg} />
              ) : (
                <Text style={styles.coverPlaceholder}>📢</Text>
              )}
              <View
                style={[
                  styles.typeBadge,
                  campaign.type === "monetary" && styles.typeMonetary,
                  campaign.type === "item" && styles.typeItem,
                  campaign.type === "both" && styles.typeBoth,
                ]}
              >
                <Text style={styles.typeBadgeText}>{campaign.type}</Text>
              </View>
            </View>

            {/* TITLE + FOUNDATION */}
            <Text style={styles.title}>{campaign.title}</Text>
            <View style={styles.foundationRow}>
              <View style={styles.foundationDot} />
              <Text style={styles.foundationText}>
                {campaign.foundation?.name}
              </Text>
            </View>

            {/* STATUS */}
            <View style={styles.statusRow}>
              <View style={[styles.statusChip, statusBgStyle]}>
                <Text style={[styles.statusChipText, statusTextStyle]}>
                  {statusLabel(campaign.status)}
                </Text>
              </View>
            </View>

            {/* DESCRIPTION */}
            <View style={styles.section}>
              <Text style={styles.label}>About this campaign</Text>
              <Text style={styles.desc}>
                {campaign.description || "No description provided."}
              </Text>
            </View>

            {/* DATES */}
            <View style={styles.datesRow}>
              <View style={styles.dateBox}>
                <Ionicons name="calendar-outline" size={14} color="#1a8a52" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.dateLabel}>Start Date</Text>
                  <Text style={styles.dateValue}>
                    {formatDate(campaign.start_date)}
                  </Text>
                </View>
              </View>
              <View style={styles.dateBox}>
                <Ionicons name="calendar-outline" size={14} color="#1a8a52" />
                <View style={{ marginLeft: 8 }}>
                  <Text style={styles.dateLabel}>End Date</Text>
                  <Text style={styles.dateValue}>
                    {formatDate(campaign.end_date)}
                  </Text>
                </View>
              </View>
            </View>

            {/* PROGRESS */}
            {campaign.type !== "item" && (
              <View style={styles.section}>
                <Text style={styles.label}>Funding Progress</Text>
                <View style={styles.progInfo}>
                  <Text style={styles.progRaised}>
                    ₱{formatMoney(campaign.current_amount)}
                  </Text>
                  <Text style={styles.progSep}>of</Text>
                  <Text style={styles.progGoal}>
                    ₱{formatMoney(campaign.goal_amount)}
                  </Text>
                  <Text style={styles.progPct}>{percent}%</Text>
                </View>
                <View style={styles.progBar}>
                  <View
                    style={[
                      styles.progFill,
                      { width: `${Math.min(percent, 100)}%` },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* PAYMENT METHODS */}
            {(campaign.type === "monetary" || campaign.type === "both") &&
              !!campaign.accepted_payment_methods?.length && (
                <View style={styles.section}>
                  <Text style={styles.label}>Accepted Payment Methods</Text>
                  <View style={styles.chipRow}>
                    {campaign.accepted_payment_methods.map(
                      (pm: PaymentMethod) => (
                        <View
                          key={pm.payment_method_id}
                          style={styles.methodChip}
                        >
                          <Text style={styles.methodChipText}>
                            {pm.icon || "💳"} {pm.name}
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                </View>
              )}

            {/* DELIVERY METHODS */}
            {(campaign.type === "item" || campaign.type === "both") &&
              !!campaign.accepted_delivery_methods?.length && (
                <View style={styles.section}>
                  <Text style={styles.label}>Item Delivery Options</Text>
                  <View style={styles.chipRow}>
                    {campaign.accepted_delivery_methods.map((dm: string) => (
                      <View key={dm} style={styles.methodChip}>
                        <Text style={styles.methodChipText}>
                          {dm === "dropoff" ? "🏢 Drop Off" : "🏠 Pick Up"}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

            {/* PAUSE REASON */}
            {campaign.status === "paused" && !!campaign.pause_reason && (
              <View style={styles.pauseBox}>
                <Text style={styles.pauseText}>
                  <Text style={{ fontWeight: "800" }}>Paused: </Text>
                  {campaign.pause_reason}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* ACTIONS */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Close</Text>
            </TouchableOpacity>
            {campaign.status === "active" && (
              <TouchableOpacity
                style={styles.btnDonate}
                onPress={() => onDonate(campaign)}
              >
                <Text style={styles.btnDonateText}>Donate Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 22,
    maxHeight: "88%",
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 15,
    color: "#0F2D52",
  },
  btnClose: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },

  cover: {
    height: 160,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#0e5c36",
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  coverImg: { width: "100%", height: "100%" },
  coverPlaceholder: { fontSize: 40 },
  typeBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: "rgba(5,150,105,0.9)",
  },
  typeMonetary: { backgroundColor: "rgba(5,150,105,0.9)" },
  typeItem: { backgroundColor: "rgba(59,130,246,0.9)" },
  typeBoth: { backgroundColor: "rgba(124,58,237,0.9)" },
  typeBadgeText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 9,
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  title: {
    fontFamily: "Nunito_900Black",
    fontSize: 17,
    color: "#0F2D52",
    marginBottom: 6,
  },
  foundationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 12,
  },
  foundationDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#1a8a52",
  },
  foundationText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: "#1a8a52",
  },

  statusRow: { marginBottom: 14 },
  statusChip: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  status_active: { backgroundColor: "#f0fdf4" },
  status_completed: { backgroundColor: "#eff6ff" },
  status_paused: { backgroundColor: "#fefce8" },
  status_cancelled: { backgroundColor: "#fef2f2" },
  status_draft: { backgroundColor: "#f1f5f9" },
  statusChipText: { fontFamily: "Nunito_700Bold", fontSize: 12 },
  statusText_active: { color: "#059669" },
  statusText_completed: { color: "#3b82f6" },
  statusText_paused: { color: "#92400e" },
  statusText_cancelled: { color: "#dc2626" },
  statusText_draft: { color: "#64748b" },

  section: { marginBottom: 14 },
  label: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 10.5,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  desc: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "#334155",
    lineHeight: 20,
  },

  datesRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  dateBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 10,
    padding: 10,
  },
  dateLabel: {
    fontFamily: "Nunito_700Bold",
    fontSize: 9.5,
    color: "#1a8a52",
    textTransform: "uppercase",
  },
  dateValue: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: "#0F2D52",
    marginTop: 1,
  },

  progInfo: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
    marginBottom: 6,
  },
  progRaised: { fontFamily: "Nunito_900Black", fontSize: 14, color: "#0e5c36" },
  progSep: { fontFamily: "Nunito_600SemiBold", fontSize: 11, color: "#cbd5e1" },
  progGoal: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11,
    color: "#94a3b8",
    flex: 1,
  },
  progPct: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 11,
    color: "#1a8a52",
  },
  progBar: {
    height: 7,
    backgroundColor: "#dcfce7",
    borderRadius: 99,
    overflow: "hidden",
  },
  progFill: { height: "100%", backgroundColor: "#1a8a52", borderRadius: 99 },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  methodChip: {
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  methodChipText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 11.5,
    color: "#0F2D52",
  },

  pauseBox: {
    backgroundColor: "#fefce8",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  pauseText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: "#92400e",
    lineHeight: 18,
  },

  actions: { flexDirection: "row", gap: 10, marginTop: 10 },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    alignItems: "center",
  },
  btnCancelText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 13,
    color: "#64748b",
  },
  btnDonate: {
    flex: 2,
    paddingVertical: 12,
    backgroundColor: "#1a8a52",
    borderRadius: 10,
    alignItems: "center",
  },
  btnDonateText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 13,
    color: "#fff",
  },
});

// Lookup maps keyed by CampaignStatus so we never index StyleSheet objects
// with a dynamic template-literal string (that's what TS7053 was complaining about).
const STATUS_BG: Record<CampaignStatus, object> = {
  active: styles.status_active,
  completed: styles.status_completed,
  paused: styles.status_paused,
  cancelled: styles.status_cancelled,
  draft: styles.status_draft,
};

const STATUS_TEXT: Record<CampaignStatus, object> = {
  active: styles.statusText_active,
  completed: styles.statusText_completed,
  paused: styles.statusText_paused,
  cancelled: styles.statusText_cancelled,
  draft: styles.statusText_draft,
};
