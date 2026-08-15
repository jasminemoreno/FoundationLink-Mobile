import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CampaignCard from "../../components/CampaignCard";
import DonateModal from "../../components/donatemodal";
import EmptyState from "../../components/EmptyState";
import CampaignDetailsModal from "../../components/viewmodal";
import api from "../../services/api";
import { Campaign } from "../../types/donortypes";

const TABS = [
  { key: "new", label: "New" },
  { key: "completed", label: "Completed" },
  { key: "paused", label: "Paused" },
  { key: "followed", label: "Followed" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const TYPE_FILTERS = [
  { key: "", label: "All Types" },
  { key: "monetary", label: "💰 Monetary" },
  { key: "item", label: "📦 Item" },
  { key: "both", label: "💰📦 Both" },
] as const;

type CategoryOption = { id: number; name: string };

const EMPTY_MESSAGES: Record<TabKey, string> = {
  new: "No campaigns found.",
  completed: "No completed campaigns yet.",
  paused: "No paused campaigns.",
  followed: "No campaigns yet from foundations you follow.",
};

export default function CampaignsScreen() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState<number | "">("");
  const [tab, setTab] = useState<TabKey>("new");
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [detailsTarget, setDetailsTarget] = useState<Campaign | null>(null);
  const [donateTarget, setDonateTarget] = useState<Campaign | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function load() {
    setIsLoading(true);
    try {
      const res = await api.get("/donor/campaigns", {
        params: { search, type: filterType, category: filterCategory, tab },
      });
      setCampaigns(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }

  async function loadCategories() {
    try {
      const res = await api.get("/donor/categories");
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setCategories([]);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  useFocusEffect(
    useCallback(() => {
      load();
      loadCategories();
    }, [tab, filterType, filterCategory]) // eslint-disable-line react-hooks/exhaustive-deps
  );

  // debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load();
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  function openDonate(c: Campaign) {
    setDonateTarget(c);
  }
  function openDetails(c: Campaign) {
    setDetailsTarget(c);
  }
  function onDonateFromDetails(c: Campaign) {
    setDetailsTarget(null);
    setDonateTarget(c);
  }
  function onDonated() {
    setDonateTarget(null);
    load();
  }

  const selectedTypeLabel =
    TYPE_FILTERS.find((t) => t.key === filterType)?.label ?? "All Types";

  const selectedCategoryLabel =
    filterCategory === ""
      ? "All Categories"
      : categories.find((c) => c.id === filterCategory)?.name ??
        "All Categories";

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1a8a52"
          />
        }
        onScrollBeginDrag={() => {
          setTypeMenuOpen(false);
          setCategoryMenuOpen(false);
        }}
      >
        <View style={styles.pageHead}>
          <Text style={styles.pageTitle}>Browse Campaigns</Text>
          <Text style={styles.pageSub}>Support causes that matter to you</Text>
        </View>

        {/* STATUS TABS */}
        <View style={styles.switchRow}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.switchBtn,
                tab === t.key && styles.switchBtnActive,
              ]}
              onPress={() => setTab(t.key)}
            >
              <Text
                style={[
                  styles.switchBtnText,
                  tab === t.key && styles.switchBtnTextActive,
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search campaigns..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* TYPE + CATEGORY FILTERS — side by side, each floats its own dropdown */}
        <View style={styles.filterRow}>
          <View style={styles.filterCol}>
            <TouchableOpacity
              style={styles.filterSelect}
              onPress={() => {
                setTypeMenuOpen(!typeMenuOpen);
                setCategoryMenuOpen(false);
              }}
            >
              <Text style={styles.filterSelectText} numberOfLines={1}>
                {selectedTypeLabel}
              </Text>
              <Ionicons
                name={typeMenuOpen ? "chevron-up" : "chevron-down"}
                size={15}
                color="#64748b"
              />
            </TouchableOpacity>

            {typeMenuOpen && (
              <View style={styles.floatingMenu}>
                {TYPE_FILTERS.map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    style={styles.floatingMenuItem}
                    onPress={() => {
                      setFilterType(t.key);
                      setTypeMenuOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.floatingMenuItemText,
                        filterType === t.key &&
                          styles.floatingMenuItemTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {t.label}
                    </Text>
                    {filterType === t.key && (
                      <Ionicons name="checkmark" size={15} color="#1a8a52" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.filterCol}>
            <TouchableOpacity
              style={styles.filterSelect}
              onPress={() => {
                setCategoryMenuOpen(!categoryMenuOpen);
                setTypeMenuOpen(false);
              }}
            >
              <Text style={styles.filterSelectText} numberOfLines={1}>
                {selectedCategoryLabel}
              </Text>
              <Ionicons
                name={categoryMenuOpen ? "chevron-up" : "chevron-down"}
                size={15}
                color="#64748b"
              />
            </TouchableOpacity>

            {categoryMenuOpen && (
              <View style={[styles.floatingMenu, styles.floatingMenuRight]}>
                <TouchableOpacity
                  style={styles.floatingMenuItem}
                  onPress={() => {
                    setFilterCategory("");
                    setCategoryMenuOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.floatingMenuItemText,
                      filterCategory === "" &&
                        styles.floatingMenuItemTextActive,
                    ]}
                  >
                    All Categories
                  </Text>
                  {filterCategory === "" && (
                    <Ionicons name="checkmark" size={15} color="#1a8a52" />
                  )}
                </TouchableOpacity>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.floatingMenuItem}
                    onPress={() => {
                      setFilterCategory(c.id);
                      setCategoryMenuOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.floatingMenuItemText,
                        filterCategory === c.id &&
                          styles.floatingMenuItemTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                    {filterCategory === c.id && (
                      <Ionicons name="checkmark" size={15} color="#1a8a52" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* LOADING */}
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#1a8a52" />
            <Text style={styles.loadingText}>Loading campaigns...</Text>
          </View>
        ) : campaigns.length === 0 ? (
          <EmptyState icon="file-tray-outline" message={EMPTY_MESSAGES[tab]} />
        ) : (
          <View style={styles.grid}>
            {campaigns.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                onViewDetails={() => openDetails(c)}
                onDonate={() => openDonate(c)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <CampaignDetailsModal
        visible={!!detailsTarget}
        campaign={detailsTarget}
        onClose={() => setDetailsTarget(null)}
        onDonate={onDonateFromDetails}
      />
      <DonateModal
        visible={!!donateTarget}
        campaign={donateTarget}
        onClose={() => setDonateTarget(null)}
        onDonated={onDonated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#c8f0e0" },
  content: { padding: 16, paddingBottom: 40 },

  pageHead: { marginBottom: 16 },
  pageTitle: { fontFamily: "Nunito_900Black", fontSize: 19, color: "#0e5c36" },
  pageSub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    color: "#475569",
    marginTop: 2,
  },

  switchRow: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#fff",
    padding: 6,
    borderRadius: 14,
    marginBottom: 14,
    shadowColor: "#005028",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  switchBtnActive: { backgroundColor: "#1a8a52" },
  switchBtnText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 11,
    color: "#4d7a64",
  },
  switchBtnTextActive: { color: "#fff" },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13.5,
    color: "#0F2D52",
  },

  /* TYPE + CATEGORY — one row, two equal columns, each anchors its own dropdown */
  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
    zIndex: 20,
  },
  filterCol: {
    flex: 1,
    position: "relative",
  },
  filterSelect: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  filterSelectText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12.5,
    color: "#0F2D52",
    flexShrink: 1,
  },
  floatingMenu: {
    position: "absolute",
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    shadowColor: "#005028",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 30,
  },
  floatingMenuRight: {
    left: "auto",
    right: 0,
    minWidth: 200,
  },
  floatingMenuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 8,
  },
  floatingMenuItemText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "#475569",
    flexShrink: 1,
  },
  floatingMenuItemTextActive: {
    fontFamily: "Nunito_800ExtraBold",
    color: "#1a8a52",
  },

  loadingWrap: {
    alignItems: "center",
    padding: 50,
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  loadingText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    color: "#94a3b8",
  },

  grid: { gap: 16 },
});
