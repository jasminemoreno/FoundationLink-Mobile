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

// "⏳ N days left" under a promotion, unless the message already says it
// (a Deadline promotion's ready-made message does: "Only 31 days left…")
function showDaysLeft(p: NonNullable<Campaign["promotion"]>) {
  if (p.days_left === null || p.days_left === undefined) return false;
  const msg = (p.message || "").toLowerCase();
  if (p.days_left === 0) return !msg.includes("last day");
  return !msg.includes(`${p.days_left} day`);
}

export default function CampaignCard({
  campaign,
  onViewDetails,
  onDonate,
}: Props) {
  const coverUrl = getImageUrl(campaign.cover_photo);
  const promo = campaign.promotion;
  const daysLeft = promo && showDaysLeft(promo);
  const donatedThisWeek = promo ? promo.donated_this_week : 0;

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
          {promo ? (
            <View style={styles.promotedBadge}>
              <Text style={styles.promotedBadgeText}>⭐ Promoted</Text>
            </View>
          ) : null}
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

        {/* The foundation's message while the campaign is promoted */}
        {promo ? (
          <View style={styles.promoMsg}>
            <Text style={styles.promoText}>📢 {promo.message}</Text>
            {/* Urgency + social proof; each line only when there is something to say */}
            {daysLeft || donatedThisWeek > 0 ? (
              <View style={styles.promoFacts}>
                {daysLeft ? (
                  <Text style={styles.promoFact}>
                    {promo.days_left === 0
                      ? "⏳ Last day!"
                      : `⏳ ${promo.days_left} ${promo.days_left === 1 ? "day" : "days"} left`}
                  </Text>
                ) : null}
                {donatedThisWeek > 0 ? (
                  <Text style={styles.promoFact}>
                    👥 {donatedThisWeek} donated this week
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

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
  // Promoted campaign: amber badge on the cover + the foundation's message (same as web)
  promotedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#b45309",
  },
  promotedBadgeText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 11,
    color: "#fff",
  },
  promoMsg: {
    marginTop: 2,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  promoText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    lineHeight: 18,
    color: "#92400e",
  },
  promoFacts: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 14,
    rowGap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderTopColor: "#fcd34d",
  },
  promoFact: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: "#92400e",
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
