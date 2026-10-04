import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import CampaignCard from "../../components/CampaignCard";
import DonateModal from "../../components/donatemodal";
import DonationRow from "../../components/DonationRow";
import EmptyState from "../../components/EmptyState";
import FoundationBubble from "../../components/FoundationBubble";
import StatCard from "../../components/StatCard";
import CampaignDetailsModal from "../../components/viewmodal";
import { useAuth } from "../../context/AuthContext";
import api, { formatMoney } from "../../services/api";
import { Campaign, DashboardData, Foundation } from "../../types/donortypes";

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export default function DashboardScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [foundations, setFoundations] = useState<Foundation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- Modal state ---
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [donateVisible, setDonateVisible] = useState(false);

  async function load() {
    try {
      const [dashRes, foundRes] = await Promise.all([
        api.get("/donor/dashboard"),
        api.get("/donor/foundations"),
        refreshUser(), // keep the greeting name in sync with the server
      ]);
      setData(dashRes.data);
      setFoundations(Array.isArray(foundRes.data) ? foundRes.data : []);
    } catch (err) {
      console.error(err);
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

  // Open the details modal for a campaign
  function openDetails(campaign: Campaign) {
    setSelectedCampaign(campaign);
    setDetailsVisible(true);
  }

  // Open the donate modal directly for a campaign
  function openDonate(campaign: Campaign) {
    setSelectedCampaign(campaign);
    setDonateVisible(true);
  }

  // "Donate Now" tapped from inside the details modal
  function handleDonateFromDetails(campaign: Campaign) {
    setDetailsVisible(false);
    setSelectedCampaign(campaign);
    setDonateVisible(true);
  }

  function handleDonated() {
    setDonateVisible(false);
    setSelectedCampaign(null);
    load(); // refresh dashboard stats/recent donations
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#1a8a52"
        />
      }
    >
      {/* HERO */}
      <LinearGradient
        colors={["#1f9459", "#36ab70", "#4dbb83"]}
        style={styles.hero}
      >
        <View style={styles.heroEyebrow}>
          <View style={styles.heroDot} />
          <Text style={styles.heroEyebrowText}>
            Good {getTimeOfDay()}, donor
          </Text>
        </View>
        <Text style={styles.heroTitle}>
          Welcome back, <Text style={styles.heroName}>{user?.first_name}!</Text>{" "}
          👋
        </Text>
        <Text style={styles.heroSub}>
          Your generosity is making a real difference. Keep it up.
        </Text>
      </LinearGradient>

      {/* STATS */}
      <View style={styles.statsRow}>
        <StatCard
          icon="cash-outline"
          value={`₱${formatMoney(data?.total_donated)}`}
          label="Total Donated"
          bg="#f0fdf4"
          color="#059669"
        />
        <StatCard
          icon="cube-outline"
          value={data?.total_items ?? 0}
          label="Items Given"
          bg="#eff6ff"
          color="#3b82f6"
        />
      </View>
      <View style={styles.statsRow}>
        <StatCard
          icon="heart-outline"
          value={data?.campaigns_supported ?? 0}
          label="Campaigns Supported"
          bg="#f5f3ff"
          color="#7c3aed"
        />
      </View>

      {/* FOUNDATIONS */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Our Foundations</Text>
          {foundations.length > 0 && (
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>
                {foundations.length} verified
              </Text>
            </View>
          )}
        </View>

        {isLoading ? null : foundations.length === 0 ? (
          <EmptyState
            icon="business-outline"
            message="No verified foundations yet."
            card={false}
          />
        ) : (
          <FlatList
            data={foundations}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.foundationsTrack}
            renderItem={({ item }) => (
              <FoundationBubble
                foundation={item}
                onPress={() => router.push(`/foundation/${item.id}`)}
              />
            )}
          />
        )}
      </View>

      {/* FEATURED CAMPAIGNS */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Featured Campaigns</Text>
          <View style={styles.livePill}>
            <Text style={styles.livePillText}>LIVE</Text>
          </View>
        </View>

        {isLoading ? null : !data || data.featured_campaigns.length === 0 ? (
          <EmptyState
            icon="megaphone-outline"
            message="No active campaigns yet."
          />
        ) : (
          <FlatList
            data={data.featured_campaigns}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.campaignsTrack}
            renderItem={({ item: c }) => (
              <View style={styles.campaignCardWrap}>
                <CampaignCard
                  campaign={c}
                  onViewDetails={() => openDetails(c)}
                  onDonate={() => openDonate(c)}
                />
              </View>
            )}
          />
        )}
      </View>

      {/* RECENT DONATIONS */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>My Recent Donations</Text>
        </View>

        {isLoading ? null : !data || data.recent_donations.length === 0 ? (
          <EmptyState
            icon="gift-outline"
            message="You haven't donated yet. Start making an impact today!"
          />
        ) : (
          <View style={styles.recentPanel}>
            {data.recent_donations.map((d) => (
              <DonationRow key={d.id} donation={d} />
            ))}
          </View>
        )}
      </View>

      {/* MODALS */}
      <CampaignDetailsModal
        visible={detailsVisible}
        campaign={selectedCampaign}
        onClose={() => setDetailsVisible(false)}
        onDonate={handleDonateFromDetails}
      />

      <DonateModal
        visible={donateVisible}
        campaign={selectedCampaign}
        onClose={() => setDonateVisible(false)}
        onDonated={handleDonated}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#c8f0e0" },
  content: { padding: 16, paddingBottom: 40 },

  hero: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
  },
  heroEyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#7eedc7" },
  heroEyebrowText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: "Nunito_900Black",
    fontSize: 19,
    color: "#fff",
    marginBottom: 6,
  },
  heroName: { color: "#7eedc7" },
  heroSub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    color: "rgba(255,255,255,0.7)",
  },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 10 },

  section: { marginTop: 14, marginBottom: 6 },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Nunito_900Black",
    fontSize: 15,
    color: "#0e5c36",
  },
  countPill: {
    backgroundColor: "#dcfce7",
    paddingVertical: 2,
    paddingHorizontal: 9,
    borderRadius: 20,
  },
  countPillText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 10,
    color: "#059669",
  },
  livePill: {
    backgroundColor: "#fef2f2",
    paddingVertical: 2,
    paddingHorizontal: 9,
    borderRadius: 20,
  },
  livePillText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 9,
    color: "#dc2626",
    letterSpacing: 0.5,
  },

  foundationsTrack: { gap: 18, paddingVertical: 4 },
  campaignsTrack: { gap: 14, paddingVertical: 2, paddingRight: 4 },
  campaignCardWrap: { width: 280 },

  recentPanel: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#005028",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
});
