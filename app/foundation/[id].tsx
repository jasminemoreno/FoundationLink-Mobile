import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import EmptyState from "../../components/EmptyState";
import Lightbox from "../../components/lightbox";
import ReactionButton from "../../components/reactionbutton";
import api, { formatDate, formatMoney, getImageUrl } from "../../services/api";
import { Campaign, FoundationDetail } from "../../types/donortypes";

const CAMP_TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "paused", label: "Paused" },
] as const;

type TabKey = (typeof CAMP_TABS)[number]["key"];

const STATUS_COLORS: Record<string, string> = {
  active: "#059669",
  completed: "#3b82f6",
  paused: "#ca8a04",
  draft: "#64748b",
  cancelled: "#dc2626",
};

function progressColor(pct: number) {
  if (pct >= 80) return "#059669";
  if (pct >= 50) return "#0e5c36";
  return "#1a8a52";
}

export default function FoundationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [foundation, setFoundation] = useState<FoundationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [campTab, setCampTab] = useState<TabKey>("all");
  const [expandedUpdates, setExpandedUpdates] = useState<number[]>([]);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    load();
    loadFollowStatus();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setIsLoading(true);
    try {
      const res = await api.get(`/donor/foundations/${id}`);
      setFoundation(res.data);
    } catch (err) {
      console.error(err);
      setFoundation(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadFollowStatus() {
    try {
      const res = await api.get(`/donor/foundations/${id}/follow-status`);
      setIsFollowing(!!res.data.following);
      setFollowersCount(res.data.followers_count ?? 0);
      setIsLiked(!!res.data.liked);
      setLikesCount(res.data.likes_count ?? 0);
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleFollow() {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const res = await api.delete(`/donor/foundations/${id}/follow`);
        setIsFollowing(false);
        setFollowersCount(
          res.data.followers_count ?? Math.max(0, followersCount - 1)
        );
      } else {
        const res = await api.post(`/donor/foundations/${id}/follow`);
        setIsFollowing(true);
        setFollowersCount(res.data.followers_count ?? followersCount + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  }

  async function toggleLike() {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      if (isLiked) {
        const res = await api.delete(`/donor/foundations/${id}/like`);
        setIsLiked(false);
        setLikesCount(res.data.likes_count ?? Math.max(0, likesCount - 1));
      } else {
        const res = await api.post(`/donor/foundations/${id}/like`);
        setIsLiked(true);
        setLikesCount(res.data.likes_count ?? likesCount + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLikeLoading(false);
    }
  }

  async function toggleReaction(
    campaignId: number,
    update: NonNullable<Campaign["updates"]>[number]
  ) {
    if (!foundation) return;

    // optimistic update
    const optimisticLiked = !update.my_reaction;
    const optimisticCount = update.total_reactions + (optimisticLiked ? 1 : -1);
    applyUpdatePatch(campaignId, update.id, {
      my_reaction: optimisticLiked,
      total_reactions: optimisticCount,
    });

    try {
      const res = await api.post(
        `/donor/campaigns/${campaignId}/updates/${update.id}/react`
      );
      applyUpdatePatch(campaignId, update.id, {
        my_reaction: res.data.reacted,
        total_reactions: res.data.total_reactions,
      });
    } catch (err) {
      // revert
      applyUpdatePatch(campaignId, update.id, {
        my_reaction: update.my_reaction,
        total_reactions: update.total_reactions,
      });
      console.error(err);
    }
  }

  function applyUpdatePatch(
    campaignId: number,
    updateId: number,
    patch: Partial<{ my_reaction: boolean; total_reactions: number }>
  ) {
    setFoundation((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        campaigns: prev.campaigns.map((c) =>
          c.id !== campaignId
            ? c
            : {
                ...c,
                updates: (c.updates ?? []).map((u) =>
                  u.id === updateId ? { ...u, ...patch } : u
                ),
              }
        ),
      };
    });
  }

  function isExpanded(campaignId: number) {
    return expandedUpdates.includes(campaignId);
  }

  function toggleUpdates(campaignId: number) {
    setExpandedUpdates((prev) =>
      prev.includes(campaignId)
        ? prev.filter((id) => id !== campaignId)
        : [...prev, campaignId]
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1a8a52" />
      </View>
    );
  }

  if (!foundation) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon="alert-circle-outline"
          message="Foundation not found."
          card={false}
        />
      </View>
    );
  }

  const logoUrl = getImageUrl(foundation.logo);
  const coverUrl = getImageUrl(foundation.cover_photo);

  const filteredCampaigns =
    campTab === "all"
      ? foundation.campaigns
      : foundation.campaigns.filter((c) => c.status === campTab);

  function campCount(key: TabKey) {
    if (!foundation) return 0;
    if (key === "all") return foundation.campaigns.length;
    return foundation.campaigns.filter((c) => c.status === key).length;
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.page} contentContainerStyle={styles.content}>
        {/* COVER */}
        <View style={styles.cover}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.coverImg} />
          ) : (
            <View style={styles.coverPlaceholder} />
          )}
          <View style={styles.coverOverlay} />

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={18} color="#fff" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* HEADER */}
        <View style={styles.profileRow}>
          <View style={styles.logoWrap}>
            {logoUrl ? (
              <Image source={{ uri: logoUrl }} style={styles.logoImg} />
            ) : (
              <Text style={styles.logoInitials}>{foundation.initials}</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{foundation.name}</Text>
            <View style={styles.metaRow}>
              {foundation.category ? (
                <Text style={styles.category}>{foundation.category}</Text>
              ) : null}
              {foundation.status === "verified" && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#059669" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
            {followersCount > 0 && (
              <Text style={styles.followersText}>
                {followersCount}{" "}
                {followersCount === 1 ? "follower" : "followers"}
              </Text>
            )}
          </View>
        </View>

        {foundation.full_address ? (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={14} color="#94a3b8" />
            <Text style={styles.addressText}>{foundation.full_address}</Text>
          </View>
        ) : null}

        {/* ACTIONS */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.likeBtn, isLiked && styles.likeBtnActive]}
            disabled={likeLoading}
            onPress={toggleLike}
          >
            {likeLoading ? (
              <ActivityIndicator
                size="small"
                color={isLiked ? "#db2777" : "#1a8a52"}
              />
            ) : (
              <>
                <Ionicons
                  name={isLiked ? "heart" : "heart-outline"}
                  size={16}
                  color={isLiked ? "#db2777" : "#1a8a52"}
                />
                <Text
                  style={[
                    styles.likeBtnText,
                    isLiked && styles.likeBtnTextActive,
                  ]}
                >
                  {likesCount}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followBtnActive]}
            disabled={followLoading}
            onPress={toggleFollow}
          >
            {followLoading ? (
              <ActivityIndicator
                size="small"
                color={isFollowing ? "#0e5c36" : "#fff"}
              />
            ) : (
              <>
                <Ionicons
                  name={isFollowing ? "checkmark" : "add"}
                  size={16}
                  color={isFollowing ? "#0e5c36" : "#fff"}
                />
                <Text
                  style={[
                    styles.followBtnText,
                    isFollowing && styles.followBtnTextActive,
                  ]}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{foundation.total_campaigns}</Text>
            <Text style={styles.statLabel}>Campaigns</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, styles.statGreen]}>
              {foundation.active_campaigns}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {foundation.completed_campaigns}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, styles.statGreen]}>
              ₱{formatMoney(foundation.total_raised)}
            </Text>
            <Text style={styles.statLabel}>Raised</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {formatDate(foundation.member_since)}
            </Text>
            <Text style={styles.statLabel}>Member Since</Text>
          </View>
        </View>

        {/* ABOUT */}
        {foundation.description ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>About</Text>
            <Text style={styles.description}>{foundation.description}</Text>
          </View>
        ) : null}

        {/* CAMPAIGNS */}
        <View style={styles.panel}>
          <View style={styles.campHead}>
            <Text style={styles.panelTitle}>Campaigns</Text>
          </View>

          <View style={styles.tabsRow}>
            {CAMP_TABS.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.tabBtn,
                  campTab === t.key && styles.tabBtnActive,
                ]}
                onPress={() => setCampTab(t.key)}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    campTab === t.key && styles.tabBtnTextActive,
                  ]}
                >
                  {t.label}
                </Text>
                <View
                  style={[
                    styles.tabCount,
                    campTab === t.key && styles.tabCountActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabCountText,
                      campTab === t.key && styles.tabCountTextActive,
                    ]}
                  >
                    {campCount(t.key)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {filteredCampaigns.length === 0 ? (
            <EmptyState
              icon="file-tray-outline"
              message={`No ${campTab === "all" ? "" : campTab} campaigns yet.`}
            />
          ) : (
            <View style={styles.campList}>
              {filteredCampaigns.map((c) => {
                const coverImg = getImageUrl(c.cover_photo);
                const photos = c.photos ?? [];
                const updates = c.updates ?? [];

                return (
                  <View key={c.id} style={styles.campItem}>
                    <View style={styles.campCover}>
                      {coverImg ? (
                        <Image
                          source={{ uri: coverImg }}
                          style={styles.campCoverImg}
                        />
                      ) : (
                        <View style={styles.campCoverPlaceholder}>
                          <Ionicons
                            name="megaphone-outline"
                            size={26}
                            color="#94a3b8"
                          />
                        </View>
                      )}
                      <View
                        style={[
                          styles.campStatusBadge,
                          { backgroundColor: STATUS_COLORS[c.status] },
                        ]}
                      >
                        <Text style={styles.campStatusText}>{c.status}</Text>
                      </View>
                    </View>

                    <View style={styles.campBody}>
                      <View style={styles.campTypeRow}>
                        <View style={styles.campTypeBadge}>
                          <Text style={styles.campTypeText}>{c.type}</Text>
                        </View>
                        {c.start_date ? (
                          <Text style={styles.campDates}>
                            {formatDate(c.start_date)}
                            {c.end_date ? ` → ${formatDate(c.end_date)}` : ""}
                          </Text>
                        ) : null}
                      </View>

                      <Text style={styles.campTitle}>{c.title}</Text>
                      {c.description ? (
                        <Text style={styles.campDesc} numberOfLines={2}>
                          {c.description}
                        </Text>
                      ) : null}

                      {c.status === "paused" && c.pause_reason ? (
                        <View style={styles.pauseBox}>
                          <Text style={styles.pauseText}>
                            ⏸ {c.pause_reason}
                          </Text>
                        </View>
                      ) : null}

                      {c.type !== "item" && c.goal_amount > 0 && (
                        <View style={styles.progressSection}>
                          <View style={styles.progressInfo}>
                            <Text style={styles.raised}>
                              ₱{formatMoney(c.current_amount)}
                            </Text>
                            <Text style={styles.goal}>
                              of ₱{formatMoney(c.goal_amount)}
                            </Text>
                            <Text style={styles.pct}>{c.percent}%</Text>
                          </View>
                          <View style={styles.barBg}>
                            <View
                              style={[
                                styles.barFill,
                                {
                                  width: `${Math.min(c.percent, 100)}%`,
                                  backgroundColor: progressColor(c.percent),
                                },
                              ]}
                            />
                          </View>
                        </View>
                      )}

                      {photos.length > 0 && (
                        <View style={styles.photosGrid}>
                          {photos.slice(0, 4).map((p, idx) => {
                            const url = getImageUrl(p.photo_path);
                            const showMore = photos.length > 4 && idx === 3;
                            return (
                              <TouchableOpacity
                                key={p.id}
                                style={styles.photoThumb}
                                onPress={() => url && setLightboxUri(url)}
                              >
                                {url && (
                                  <Image
                                    source={{ uri: url }}
                                    style={styles.photoThumbImg}
                                  />
                                )}
                                {showMore && (
                                  <View style={styles.photoMoreOverlay}>
                                    <Text style={styles.photoMoreText}>
                                      +{photos.length - 4}
                                    </Text>
                                  </View>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}

                      <View style={styles.campAction}>
                        {c.status === "active" ? (
                          <TouchableOpacity
                            style={styles.donateBtn}
                            onPress={() => {
                              // TODO: navigate to donate flow screen once built
                            }}
                          >
                            <Text style={styles.donateBtnText}>Donate Now</Text>
                          </TouchableOpacity>
                        ) : c.status === "paused" ? (
                          <View style={styles.pausedLabel}>
                            <Text style={styles.pausedLabelText}>
                              Temporarily Paused
                            </Text>
                          </View>
                        ) : c.status === "completed" ? (
                          <View style={styles.completedLabel}>
                            <Text style={styles.completedLabelText}>
                              ✓ Completed
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {/* UPDATES */}
                    {updates.length > 0 && (
                      <View style={styles.updatesSection}>
                        <TouchableOpacity
                          style={styles.updatesToggle}
                          onPress={() => toggleUpdates(c.id)}
                        >
                          <Text style={styles.updatesToggleText}>
                            📰 {updates.length} update
                            {updates.length === 1 ? "" : "s"}
                          </Text>
                          <Ionicons
                            name={
                              isExpanded(c.id) ? "chevron-up" : "chevron-down"
                            }
                            size={14}
                            color="#94a3b8"
                          />
                        </TouchableOpacity>

                        {isExpanded(c.id) && (
                          <View style={styles.updatesBody}>
                            {updates.map((u, i) => {
                              const heroUrl = u.photos?.[0]
                                ? getImageUrl(u.photos[0])
                                : null;
                              const restPhotos = u.photos?.slice(1, 5) ?? [];

                              return (
                                <View
                                  key={u.id}
                                  style={[
                                    styles.miniUpdate,
                                    i > 0 && styles.miniUpdateDivider,
                                  ]}
                                >
                                  <View style={styles.miniUpdateHead}>
                                    <Text style={styles.miniUpdateTitle}>
                                      {u.title}
                                    </Text>
                                    <Text style={styles.miniUpdateDate}>
                                      {u.posted_at}
                                    </Text>
                                  </View>
                                  {u.content ? (
                                    <Text style={styles.miniUpdateDesc}>
                                      {u.content}
                                    </Text>
                                  ) : null}

                                  {heroUrl && (
                                    <TouchableOpacity
                                      onPress={() => setLightboxUri(heroUrl)}
                                      style={styles.updateHero}
                                    >
                                      <Image
                                        source={{ uri: heroUrl }}
                                        style={styles.updateHeroImg}
                                      />
                                    </TouchableOpacity>
                                  )}

                                  {restPhotos.length > 0 && (
                                    <View style={styles.thumbStrip}>
                                      {restPhotos.map((photo, idx) => {
                                        const url = getImageUrl(photo);
                                        const showMore =
                                          (u.photos?.length ?? 0) > 5 &&
                                          idx === 3;
                                        return (
                                          <TouchableOpacity
                                            key={idx}
                                            style={styles.miniThumb}
                                            onPress={() =>
                                              url && setLightboxUri(url)
                                            }
                                          >
                                            {url && (
                                              <Image
                                                source={{ uri: url }}
                                                style={styles.miniThumbImg}
                                              />
                                            )}
                                            {showMore && (
                                              <View
                                                style={styles.photoMoreOverlay}
                                              >
                                                <Text
                                                  style={styles.photoMoreText}
                                                >
                                                  +{(u.photos?.length ?? 0) - 5}
                                                </Text>
                                              </View>
                                            )}
                                          </TouchableOpacity>
                                        );
                                      })}
                                    </View>
                                  )}

                                  <ReactionButton
                                    liked={!!u.my_reaction}
                                    count={u.total_reactions}
                                    onToggle={() => toggleReaction(c.id, u)}
                                  />
                                </View>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <Lightbox uri={lightboxUri} onClose={() => setLightboxUri(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#c8f0e0" },
  content: { paddingBottom: 40 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#c8f0e0",
  },

  cover: { height: 150, backgroundColor: "#0e5c36" },
  coverImg: { width: "100%", height: "100%", position: "absolute" },
  coverPlaceholder: { flex: 1, backgroundColor: "#0e5c36" },
  coverOverlay: {
    position: "absolute",
    inset: 0 as any,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  backBtn: {
    position: "absolute",
    top: 50,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  backBtnText: { fontFamily: "Nunito_700Bold", fontSize: 12, color: "#fff" },

  profileRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    marginTop: -28,
    gap: 12,
  },
  logoWrap: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  logoImg: { width: "100%", height: "100%" },
  logoInitials: {
    fontFamily: "Nunito_900Black",
    fontSize: 20,
    color: "#0e5c36",
  },

  profileInfo: { flex: 1, marginTop: 28 },
  name: { fontFamily: "Nunito_900Black", fontSize: 17, color: "#0F2D52" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    flexWrap: "wrap",
  },
  category: {
    fontFamily: "Nunito_700Bold",
    fontSize: 11,
    color: "#1a8a52",
    backgroundColor: "#f0fdf4",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  verifiedText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 10,
    color: "#059669",
  },
  followersText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11,
    color: "#64748b",
    marginTop: 3,
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  addressText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: "#64748b",
    flex: 1,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  likeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  likeBtnActive: { backgroundColor: "#fdf2f8", borderColor: "#fbcfe8" },
  likeBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 13,
    color: "#1a8a52",
  },
  likeBtnTextActive: { color: "#db2777" },

  followBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1a8a52",
  },
  followBtnActive: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1.5,
    borderColor: "#bbf7d0",
  },
  followBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 13,
    color: "#fff",
  },
  followBtnTextActive: { color: "#0e5c36" },

  statsGrid: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    shadowColor: "#005028",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  statBox: { flex: 1, alignItems: "center" },
  statValue: {
    fontFamily: "Nunito_900Black",
    fontSize: 12.5,
    color: "#0F2D52",
    textAlign: "center",
  },
  statGreen: { color: "#059669" },
  statLabel: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 9,
    color: "#94a3b8",
    marginTop: 2,
    textAlign: "center",
  },

  panel: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    shadowColor: "#005028",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  panelTitle: {
    fontFamily: "Nunito_900Black",
    fontSize: 14,
    color: "#0F2D52",
    marginBottom: 10,
  },
  description: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "#475569",
    lineHeight: 20,
  },

  campHead: { marginBottom: 10 },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 4,
    gap: 4,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 7,
    borderRadius: 8,
  },
  tabBtnActive: { backgroundColor: "#1a8a52" },
  tabBtnText: {
    fontFamily: "Nunito_700Bold",
    fontSize: 10.5,
    color: "#64748b",
  },
  tabBtnTextActive: { color: "#fff" },
  tabCount: {
    backgroundColor: "#e2e8f0",
    borderRadius: 20,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tabCountActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  tabCountText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 9,
    color: "#64748b",
  },
  tabCountTextActive: { color: "#fff" },

  campList: { gap: 16 },
  campItem: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  campCover: { height: 130, backgroundColor: "#f0fdf4" },
  campCoverImg: { width: "100%", height: "100%" },
  campCoverPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  campStatusBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  campStatusText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 9,
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  campBody: { padding: 14 },
  campTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  campTypeBadge: {
    backgroundColor: "#f0fdf4",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  campTypeText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 9.5,
    color: "#059669",
    textTransform: "capitalize",
  },
  campDates: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 10.5,
    color: "#94a3b8",
  },
  campTitle: {
    fontFamily: "Nunito_900Black",
    fontSize: 14,
    color: "#0F2D52",
    marginBottom: 4,
  },
  campDesc: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: "#64748b",
    lineHeight: 17,
    marginBottom: 10,
  },

  pauseBox: {
    backgroundColor: "#fefce8",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  pauseText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11.5,
    color: "#92400e",
  },

  progressSection: { marginBottom: 12 },
  progressInfo: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
    marginBottom: 5,
  },
  raised: { fontFamily: "Nunito_900Black", fontSize: 13, color: "#0e5c36" },
  goal: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 10.5,
    color: "#94a3b8",
    flex: 1,
  },
  pct: { fontFamily: "Nunito_800ExtraBold", fontSize: 10.5, color: "#1a8a52" },
  barBg: {
    height: 6,
    backgroundColor: "#dcfce7",
    borderRadius: 99,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 99 },

  photosGrid: { flexDirection: "row", gap: 6, marginBottom: 12 },
  photoThumb: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#e2e8f0",
  },
  photoThumbImg: { width: "100%", height: "100%" },
  photoMoreOverlay: {
    position: "absolute",
    inset: 0 as any,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  photoMoreText: { fontFamily: "Nunito_900Black", fontSize: 13, color: "#fff" },

  campAction: { marginTop: 2 },
  donateBtn: {
    backgroundColor: "#1a8a52",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  donateBtnText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12.5,
    color: "#fff",
  },
  pausedLabel: {
    backgroundColor: "#fefce8",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  pausedLabelText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12,
    color: "#ca8a04",
  },
  completedLabel: {
    backgroundColor: "#f0fdf4",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  completedLabelText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12,
    color: "#059669",
  },

  updatesSection: { borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  updatesToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  updatesToggleText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12,
    color: "#1a8a52",
  },
  updatesBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 14 },

  miniUpdate: { paddingTop: 0 },
  miniUpdateDivider: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    borderStyle: "dashed",
    paddingTop: 12,
  },
  miniUpdateHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
    flexWrap: "wrap",
  },
  miniUpdateTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12.5,
    color: "#0F2D52",
  },
  miniUpdateDate: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 10,
    color: "#94a3b8",
  },
  miniUpdateDesc: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 8,
  },

  updateHero: {
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 8,
    aspectRatio: 16 / 9,
    backgroundColor: "#e2e8f0",
  },
  updateHeroImg: { width: "100%", height: "100%" },

  thumbStrip: { flexDirection: "row", gap: 6, marginBottom: 8 },
  miniThumb: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#e2e8f0",
  },
  miniThumbImg: { width: "100%", height: "100%" },
});
