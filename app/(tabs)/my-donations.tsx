import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DonationRow from "../../components/DonationRow";
import EmptyState from "../../components/EmptyState";
import FoundationBubble from "../../components/FoundationBubble";
import StatCard from "../../components/StatCard";
import api, { formatMoney } from "../../services/api";
import { Donation, Foundation } from "../../types/donortypes";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "received", label: "Received" },
  { key: "cancelled", label: "Cancelled" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const TYPE_FILTERS = [
  { key: "", label: "All Types" },
  { key: "monetary", label: "💰 Monetary" },
  { key: "item", label: "📦 Item" },
] as const;

export default function MyDonationsScreen() {
  const router = useRouter();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [foundations, setFoundations] = useState<Foundation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [filterType, setFilterType] = useState("");
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      const [donRes, foundRes] = await Promise.all([
        api.get("/donor/donations"),
        api.get("/donor/foundations"),
      ]);
      setDonations(Array.isArray(donRes.data) ? donRes.data : []);
      setFoundations(Array.isArray(foundRes.data) ? foundRes.data : []);
    } catch (err) {
      console.error(err);
      setDonations([]);
      setFoundations([]);
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

  function tabCount(key: TabKey) {
    if (key === "all") return donations.length;
    return donations.filter((d) => d.status === key).length;
  }

  const filtered = donations.filter((d) => {
    const matchTab = activeTab === "all" || d.status === activeTab;
    const matchType = filterType === "" || d.type === filterType;
    return matchTab && matchType;
  });

  const totalDonated = donations
    .filter((d) => d.type === "monetary")
    .reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const itemCount = donations.filter((d) => d.type === "item").length;
  const receivedCount = donations.filter((d) => d.status === "received").length;

  const selectedTypeLabel =
    TYPE_FILTERS.find((t) => t.key === filterType)?.label ?? "All Types";

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
      {/* HEAD */}
      <View style={styles.pageHead}>
        <Text style={styles.kicker}>YOUR IMPACT</Text>
        <Text style={styles.title}>My Donations</Text>
        <Text style={styles.sub}>
          Track all your donations and their status
        </Text>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        <StatCard
          icon="cash-outline"
          value={`₱${formatMoney(totalDonated)}`}
          label="Total Donated"
          bg="#d5f5e3"
          color="#0e5c36"
        />
      </View>
      <View style={styles.statsRow}>
        <StatCard
          icon="cube-outline"
          value={itemCount}
          label="Item Donations"
          bg="#dbeafe"
          color="#1e40af"
        />
        <StatCard
          icon="checkmark-circle-outline"
          value={receivedCount}
          label="Received"
          bg="#fef3c7"
          color="#92400e"
        />
      </View>

      {/* FOUNDATIONS */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Our Foundations</Text>
          <TouchableOpacity onPress={() => router.push("/campaigns")}>
            <Text style={styles.seeAll}>See all campaigns →</Text>
          </TouchableOpacity>
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

      {/* FILTERS */}
      <View style={styles.filtersRow}>
        <View style={styles.tabsWrap}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.tabBtn,
                activeTab === t.key && styles.tabBtnActive,
              ]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === t.key && styles.tabBtnTextActive,
                ]}
              >
                {t.label}
              </Text>
              <View
                style={[
                  styles.tabCount,
                  activeTab === t.key && styles.tabCountActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabCountText,
                    activeTab === t.key && styles.tabCountTextActive,
                  ]}
                >
                  {tabCount(t.key)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ marginBottom: 16 }}>
        <TouchableOpacity
          style={styles.filterSelect}
          onPress={() => setTypeMenuOpen(!typeMenuOpen)}
        >
          <Text style={styles.filterSelectText}>{selectedTypeLabel}</Text>
          <Ionicons
            name={typeMenuOpen ? "chevron-up" : "chevron-down"}
            size={16}
            color="#64748b"
          />
        </TouchableOpacity>

        {typeMenuOpen && (
          <View style={styles.filterMenu}>
            {TYPE_FILTERS.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={styles.filterMenuItem}
                onPress={() => {
                  setFilterType(t.key);
                  setTypeMenuOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.filterMenuItemText,
                    filterType === t.key && styles.filterMenuItemTextActive,
                  ]}
                >
                  {t.label}
                </Text>
                {filterType === t.key && (
                  <Ionicons name="checkmark" size={16} color="#1a8a52" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* LOADING */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#1a8a52" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="gift-outline"
          message="No donations found."
          actionLabel="Browse Campaigns"
          onAction={() => router.push("/campaigns")}
        />
      ) : (
        <View style={styles.tableCard}>
          {filtered.map((d) => (
            <DonationRow key={d.id} donation={d} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#c8f0e0" },
  content: { padding: 16, paddingBottom: 40 },

  pageHead: { marginBottom: 16 },
  kicker: {
    alignSelf: "flex-start",
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 9.5,
    letterSpacing: 1,
    color: "#1a8a52",
    backgroundColor: "#e6f7ee",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginBottom: 8,
  },
  title: {
    fontFamily: "Nunito_900Black",
    fontSize: 20,
    color: "#0e5c36",
    marginBottom: 3,
  },
  sub: { fontFamily: "Nunito_600SemiBold", fontSize: 12.5, color: "#5b7568" },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 10 },

  section: { marginBottom: 18 },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 14,
    color: "#0e3d27",
  },
  seeAll: { fontFamily: "Nunito_700Bold", fontSize: 11.5, color: "#1a8a52" },
  foundationsTrack: { gap: 18, paddingVertical: 4 },

  filtersRow: { marginBottom: 10 },
  tabsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    backgroundColor: "#fff",
    padding: 6,
    borderRadius: 14,
    shadowColor: "#005028",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 9,
  },
  tabBtnActive: { backgroundColor: "#1a8a52" },
  tabBtnText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 11.5,
    color: "#64748b",
  },
  tabBtnTextActive: { color: "#fff" },
  tabCount: {
    backgroundColor: "#eef4f0",
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabCountActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  tabCountText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 9.5,
    color: "#94a3b8",
  },
  tabCountTextActive: { color: "#fff" },

  filterSelect: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  filterSelectText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12.5,
    color: "#0F2D52",
  },
  filterMenu: {
    backgroundColor: "#fff",
    borderRadius: 11,
    marginTop: 6,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  filterMenuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  filterMenuItemText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    color: "#475569",
  },
  filterMenuItemTextActive: {
    fontFamily: "Nunito_800ExtraBold",
    color: "#1a8a52",
  },

  loadingWrap: {
    alignItems: "center",
    padding: 50,
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 18,
  },
  loadingText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    color: "#94a3b8",
  },

  tableCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#005028",
    shadowOpacity: 0.09,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
});
