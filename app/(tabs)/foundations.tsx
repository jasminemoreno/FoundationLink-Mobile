import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import EmptyState from "../../components/EmptyState";
import api, { getImageUrl } from "../../services/api";
import { Foundation } from "../../types/donortypes";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Has Active" },
  { key: "done", label: "Completed" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default function FoundationsScreen() {
  const router = useRouter();
  const [foundations, setFoundations] = useState<Foundation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [activeCategory, setActiveCategory] = useState("all");
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setIsLoading(true);
    try {
      const res = await api.get("/donor/foundations");
      setFoundations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setFoundations([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const totalActive = foundations.reduce(
    (sum, f) => sum + (f.active_campaigns ?? 0),
    0
  );

  // Category options — unique categories present in the loaded foundations
  const categories = useMemo(() => {
    const set = new Set(
      foundations.map((f) => f.category).filter((c): c is string => !!c)
    );
    return Array.from(set).sort();
  }, [foundations]);

  let filtered = foundations;
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (f) =>
        f.name?.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q) ||
        f.category?.toLowerCase().includes(q) ||
        f.city_municipality?.toLowerCase().includes(q)
    );
  }
  if (activeFilter === "active") {
    filtered = filtered.filter((f) => (f.active_campaigns ?? 0) > 0);
  } else if (activeFilter === "done") {
    filtered = filtered.filter((f) => (f.completed_campaigns ?? 0) > 0);
  }
  if (activeCategory !== "all") {
    filtered = filtered.filter((f) => f.category === activeCategory);
  }

  const selectedCategoryLabel =
    activeCategory === "all" ? "Category" : activeCategory;

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
      onScrollBeginDrag={() => setCategoryMenuOpen(false)}
    >
      {/* HEAD */}
      <View style={styles.pageHead}>
        <Text style={styles.eyebrow}>EXPLORE</Text>
        <Text style={styles.title}>Our Foundations</Text>
        <Text style={styles.sub}>
          Discover verified organizations making a difference in your community.
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{foundations.length}</Text>
            <Text style={styles.statLabel}>Verified Foundations</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{totalActive}</Text>
            <Text style={styles.statLabel}>Active Campaigns</Text>
          </View>
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color="#94a3b8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search foundations..."
          placeholderTextColor="#cbd5e1"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* FILTER ROW: status tabs + compact category pill, one line */}
      <View style={styles.filterRow}>
        <View style={styles.filterTabs}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterTab,
                activeFilter === f.key && styles.filterTabActive,
              ]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  activeFilter === f.key && styles.filterTabTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.categoryAnchor}>
          <TouchableOpacity
            style={[
              styles.categoryPill,
              activeCategory !== "all" && styles.categoryPillActive,
            ]}
            onPress={() => setCategoryMenuOpen(!categoryMenuOpen)}
          >
            <Text
              style={[
                styles.categoryPillText,
                activeCategory !== "all" && styles.categoryPillTextActive,
              ]}
              numberOfLines={1}
            >
              {selectedCategoryLabel}
            </Text>
            <Ionicons
              name={categoryMenuOpen ? "chevron-up" : "chevron-down"}
              size={14}
              color={activeCategory !== "all" ? "#fff" : "#64748b"}
            />
          </TouchableOpacity>

          {categoryMenuOpen && (
            <View style={styles.floatingMenu}>
              <TouchableOpacity
                style={styles.floatingMenuItem}
                onPress={() => {
                  setActiveCategory("all");
                  setCategoryMenuOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.floatingMenuItemText,
                    activeCategory === "all" &&
                      styles.floatingMenuItemTextActive,
                  ]}
                >
                  All Categories
                </Text>
                {activeCategory === "all" && (
                  <Ionicons name="checkmark" size={15} color="#1a8a52" />
                )}
              </TouchableOpacity>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={styles.floatingMenuItem}
                  onPress={() => {
                    setActiveCategory(c);
                    setCategoryMenuOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.floatingMenuItemText,
                      activeCategory === c && styles.floatingMenuItemTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {c}
                  </Text>
                  {activeCategory === c && (
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
          <Text style={styles.loadingText}>Finding foundations...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="business-outline"
          message="Try adjusting your search or filter."
          actionLabel="Reset filters"
          onAction={() => {
            setSearch("");
            setActiveFilter("all");
            setActiveCategory("all");
          }}
        />
      ) : (
        <View style={styles.grid}>
          {filtered.map((f) => {
            const coverUrl = getImageUrl(f.cover_photo);
            const logoUrl = getImageUrl(f.logo);
            return (
              <TouchableOpacity
                key={f.id}
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => router.push(`/foundation/${f.id}`)}
              >
                <View style={styles.cover}>
                  {coverUrl ? (
                    <Image source={{ uri: coverUrl }} style={styles.coverImg} />
                  ) : (
                    <View style={styles.coverPlaceholder} />
                  )}
                  <View style={styles.coverOverlay} />
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
                  </View>
                </View>

                <View style={styles.logoWrap}>
                  <View style={styles.logo}>
                    {logoUrl ? (
                      <Image source={{ uri: logoUrl }} style={styles.logoImg} />
                    ) : (
                      <Text style={styles.logoInitials}>{f.initials}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardName}>{f.name}</Text>
                  {f.category ? (
                    <Text style={styles.cardCategory}>{f.category}</Text>
                  ) : null}
                  {f.description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {f.description}
                    </Text>
                  ) : null}

                  {f.city_municipality ? (
                    <View style={styles.locationRow}>
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color="#94a3b8"
                      />
                      <Text style={styles.locationText}>
                        {f.city_municipality}
                        {f.province ? `, ${f.province}` : ""}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.statsGrid}>
                    <View style={styles.statCell}>
                      <Text style={[styles.statCellVal, styles.statGreen]}>
                        {f.active_campaigns ?? 0}
                      </Text>
                      <Text style={styles.statCellLabel}>Active</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCell}>
                      <Text style={styles.statCellVal}>
                        {f.total_campaigns ?? 0}
                      </Text>
                      <Text style={styles.statCellLabel}>Total</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statCell}>
                      <Text style={styles.statCellVal}>
                        {f.completed_campaigns ?? 0}
                      </Text>
                      <Text style={styles.statCellLabel}>Done</Text>
                    </View>
                  </View>

                  <View style={styles.viewBtn}>
                    <Text style={styles.viewBtnText}>View Foundation</Text>
                    <Ionicons name="arrow-forward" size={14} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {!isLoading && filtered.length > 0 && (
        <Text style={styles.resultsCount}>
          Showing {filtered.length} of {foundations.length} foundations
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#c8f0e0" },
  content: { padding: 16, paddingBottom: 40 },

  pageHead: { marginBottom: 18 },
  eyebrow: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 10,
    color: "#1a8a52",
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontFamily: "Nunito_900Black",
    fontSize: 21,
    color: "#0e5c36",
    marginBottom: 4,
  },
  sub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 14,
  },

  statsRow: { flexDirection: "row", gap: 12 },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    shadowColor: "#005028",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  statVal: { fontFamily: "Nunito_900Black", fontSize: 20, color: "#0F2D52" },
  statLabel: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 10,
    color: "#94a3b8",
    marginTop: 3,
    textAlign: "center",
  },

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

  /* FILTER ROW — status tabs (flexible) + category pill (auto width), one line */
  filterRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 18,
    zIndex: 20,
  },
  filterTabs: {
    flex: 1,
    flexDirection: "row",
    gap: 4,
    backgroundColor: "#fff",
    padding: 4,
    borderRadius: 12,
    shadowColor: "#005028",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: "center",
  },
  filterTabActive: { backgroundColor: "#1a8a52" },
  filterTabText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 11,
    color: "#64748b",
  },
  filterTabTextActive: { color: "#fff" },

  /* Compact category pill, anchors its own floating dropdown */
  categoryAnchor: {
    position: "relative",
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    maxWidth: 120,
  },
  categoryPillActive: {
    backgroundColor: "#1a8a52",
    borderColor: "#1a8a52",
  },
  categoryPillText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 12,
    color: "#0F2D52",
    flexShrink: 1,
  },
  categoryPillTextActive: { color: "#fff" },

  floatingMenu: {
    position: "absolute",
    top: 46,
    right: 0,
    minWidth: 180,
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
  floatingMenuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 8,
  },
  floatingMenuItemText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
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

  grid: { gap: 18 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#005028",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cover: { height: 100, backgroundColor: "#0e5c36" },
  coverImg: { width: "100%", height: "100%", position: "absolute" },
  coverPlaceholder: { flex: 1, backgroundColor: "#0e5c36" },
  coverOverlay: {
    position: "absolute",
    inset: 0 as any,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  verifiedBadge: {
    position: "absolute",
    top: 10,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 20,
  },
  verifiedBadgeText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 9.5,
    color: "#059669",
  },

  logoWrap: { alignItems: "center", marginTop: -28 },
  logo: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#1a8a52",
    borderWidth: 3,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  logoImg: { width: "100%", height: "100%" },
  logoInitials: { fontFamily: "Nunito_900Black", fontSize: 16, color: "#fff" },

  cardBody: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 18 },
  cardName: {
    fontFamily: "Nunito_900Black",
    fontSize: 15,
    color: "#0F2D52",
    textAlign: "center",
    marginBottom: 3,
  },
  cardCategory: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 9.5,
    color: "#1a8a52",
    textAlign: "center",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardDesc: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11.5,
    color: "#64748b",
    lineHeight: 17,
    textAlign: "center",
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginBottom: 14,
  },
  locationText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 10.5,
    color: "#94a3b8",
  },

  statsGrid: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  statCell: { flex: 1, alignItems: "center", gap: 2 },
  statDivider: { width: 1, height: 26, backgroundColor: "#e2e8f0" },
  statCellVal: {
    fontFamily: "Nunito_900Black",
    fontSize: 14,
    color: "#0F2D52",
  },
  statGreen: { color: "#059669" },
  statCellLabel: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 9.5,
    color: "#94a3b8",
  },

  viewBtn: {
    backgroundColor: "#1a8a52",
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  viewBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12.5,
    color: "#fff",
  },

  resultsCount: {
    marginTop: 18,
    textAlign: "center",
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11.5,
    color: "#94a3b8",
  },
});
