import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatMoney, getImageUrl } from "../services/api";
import { Campaign } from "../types/donortypes";

type Props = {
  campaign: Campaign;
  onViewDetails: () => void;
  onDonate: () => void;
};

const TYPE_COLORS: Record<string, string> = {
  monetary: "#059669",
  item: "#3b82f6",
  both: "#7c3aed",
};

export default function CampaignCard({
  campaign,
  onViewDetails,
  onDonate,
}: Props) {
  const coverUrl = getImageUrl(campaign.cover_photo);

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onViewDetails} activeOpacity={0.9}>
        <View style={styles.cover}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.coverImg} />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons
                name="megaphone-outline"
                size={30}
                color="rgba(255,255,255,0.7)"
              />
            </View>
          )}
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: TYPE_COLORS[campaign.type] },
            ]}
          >
            <Text style={styles.typeBadgeText}>{campaign.type}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.body}>
        <View style={styles.foundationRow}>
          <View style={styles.dot} />
          <Text style={styles.foundationName} numberOfLines={1}>
            {campaign.foundation.name}
          </Text>
        </View>

        <TouchableOpacity onPress={onViewDetails}>
          <Text style={styles.title} numberOfLines={1}>
            {campaign.title}
          </Text>
        </TouchableOpacity>

        {campaign.description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {campaign.description}
          </Text>
        ) : null}

        {campaign.type !== "item" && (
          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <Text style={styles.raised}>
                ₱{formatMoney(campaign.current_amount)}
              </Text>
              <Text style={styles.sep}>of</Text>
              <Text style={styles.goal}>
                ₱{formatMoney(campaign.goal_amount)}
              </Text>
              <Text style={styles.pct}>{campaign.percent}%</Text>
            </View>
            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  { width: `${Math.min(campaign.percent, 100)}%` },
                ]}
              />
            </View>
          </View>
        )}

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.detailsBtn} onPress={onViewDetails}>
            <Text style={styles.detailsBtnText}>View Details</Text>
          </TouchableOpacity>
          {campaign.status === "active" ? (
            <TouchableOpacity style={styles.donateBtn} onPress={onDonate}>
              <Ionicons name="heart" size={13} color="#fff" />
              <Text style={styles.donateBtnText}>Donate Now</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {campaign.status === "completed" ? "Completed" : "Paused"}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#005028",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cover: { height: 150, backgroundColor: "#0e5c36" },
  coverImg: { width: "100%", height: "100%" },
  coverPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  typeBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 20,
  },
  typeBadgeText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 9,
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  body: { padding: 16 },
  foundationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4,
  },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#1a8a52" },
  foundationName: {
    fontFamily: "Nunito_700Bold",
    fontSize: 11,
    color: "#1a8a52",
  },
  title: {
    fontFamily: "Nunito_900Black",
    fontSize: 15,
    color: "#0F2D52",
    marginBottom: 4,
  },
  desc: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: "#64748b",
    marginBottom: 12,
    lineHeight: 17,
  },
  progressSection: { marginBottom: 14 },
  progressInfo: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginBottom: 6,
  },
  raised: { fontFamily: "Nunito_900Black", fontSize: 14, color: "#0e5c36" },
  sep: { fontFamily: "Nunito_600SemiBold", fontSize: 11, color: "#cbd5e1" },
  goal: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11,
    color: "#94a3b8",
    flex: 1,
  },
  pct: { fontFamily: "Nunito_800ExtraBold", fontSize: 11, color: "#1a8a52" },
  barBg: {
    height: 6,
    backgroundColor: "#dcfce7",
    borderRadius: 99,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: "#1a8a52", borderRadius: 99 },
  btnRow: { flexDirection: "row", gap: 8 },
  detailsBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  detailsBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12.5,
    color: "#0F2D52",
  },
  donateBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#1a8a52",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  donateBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12.5,
    color: "#fff",
  },
  statusBadge: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
  },
  statusBadgeText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12.5,
    color: "#1a8a52",
  },
});
