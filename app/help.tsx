import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import EmptyState from "../components/EmptyState";

type CategoryKey =
  | "getting-started"
  | "donations"
  | "items"
  | "account"
  | "campaigns"
  | "security";

const CATEGORIES: { key: CategoryKey; label: string; icon: string }[] = [
  { key: "getting-started", label: "Getting Started", icon: "🚀" },
  { key: "donations", label: "Donations", icon: "💰" },
  { key: "items", label: "Item Donations", icon: "📦" },
  { key: "account", label: "My Account", icon: "👤" },
  { key: "campaigns", label: "Campaigns", icon: "📢" },
  { key: "security", label: "Security", icon: "🔒" },
];

const QUICK_LINKS: {
  icon: string;
  title: string;
  desc: string;
  category: CategoryKey;
}[] = [
  {
    icon: "🚀",
    title: "Getting Started",
    desc: "New to FoundationLink?",
    category: "getting-started",
  },
  {
    icon: "💰",
    title: "Making Donations",
    desc: "How to donate",
    category: "donations",
  },
  {
    icon: "📦",
    title: "Item Donations",
    desc: "Donating goods",
    category: "items",
  },
  {
    icon: "👤",
    title: "My Account",
    desc: "Profile & settings",
    category: "account",
  },
];

const FAQS: { category: CategoryKey; q: string; a: string }[] = [
  {
    category: "getting-started",
    q: "What is FoundationLink?",
    a: "FoundationLink is a platform that connects donors with verified foundations and their campaigns. You can donate money or items to causes you care about.",
  },
  {
    category: "getting-started",
    q: "How do I create an account?",
    a: 'Click "Register" on the login page, select "Donor", fill in your personal information, and verify your email. It only takes a few minutes!',
  },
  {
    category: "getting-started",
    q: "Is FoundationLink free to use?",
    a: "Yes! Creating an account and donating through FoundationLink is completely free for donors.",
  },
  {
    category: "getting-started",
    q: "How do I find campaigns to support?",
    a: "Browse the Campaigns page to see all active campaigns. You can filter by type (monetary or item) to find causes that match what you want to give.",
  },

  {
    category: "donations",
    q: "How do I make a monetary donation?",
    a: 'Go to the Campaigns page, find a campaign you want to support, click "Donate Now", select the amount (or enter a custom amount), and submit. The foundation will be notified.',
  },
  {
    category: "donations",
    q: "What payment methods are accepted?",
    a: "Currently donations are recorded through the platform and payment arrangements are made directly with the foundation. Contact the foundation for payment details.",
  },
  {
    category: "donations",
    q: "Can I see my donation history?",
    a: "Yes! Go to My Donations to see all your past and current donations, their status, and details.",
  },
  {
    category: "donations",
    q: 'What does "Pending" status mean?',
    a: '"Pending" means your donation has been submitted and is waiting for the foundation to confirm receipt. Once they mark it as received, the status will update to "Received".',
  },
  {
    category: "donations",
    q: "Can I cancel a donation?",
    a: "Once a donation is submitted, cancellation depends on the foundation. Contact the foundation directly if you need to cancel.",
  },

  {
    category: "items",
    q: "How do I donate items?",
    a: 'Find a campaign that accepts item donations, click "Donate Now", select "Item", fill in the item name, quantity, and description, then submit. The foundation will contact you for drop-off arrangements.',
  },
  {
    category: "items",
    q: "What kinds of items can I donate?",
    a: "It depends on what each campaign needs. Common items include clothes, food, medicine, school supplies, and household goods. Check the campaign description for specific needs.",
  },
  {
    category: "items",
    q: "Where do I drop off my items?",
    a: "After submitting an item donation, the foundation will reach out to arrange drop-off or pick-up. You can also add a note in your donation with your contact details.",
  },

  {
    category: "account",
    q: "How do I update my profile?",
    a: "Go to My Profile from the menu. You can update your name, phone, address, gender, and birthdate there.",
  },
  {
    category: "account",
    q: "How do I change my password?",
    a: 'In My Profile, scroll down to the "Change Password" section, enter your new password, confirm it, and click Update Password.',
  },
  {
    category: "account",
    q: "Can I change my email address?",
    a: "Email cannot be changed once registered as it serves as your unique identifier. Contact support if you need assistance.",
  },
  {
    category: "account",
    q: "How do I logout?",
    a: 'Tap your avatar in the top right corner, then tap "Logout" from the menu.',
  },

  {
    category: "campaigns",
    q: 'What is a "paused" campaign?',
    a: "A paused campaign is temporarily not accepting donations. The foundation may be sorting existing donations or handling logistics. It will resume accepting donations when the foundation reactivates it.",
  },
  {
    category: "campaigns",
    q: "What happens when a campaign reaches its goal?",
    a: "When a monetary campaign reaches its goal amount, the foundation may mark it as completed. Item campaigns continue until the foundation marks them as completed.",
  },
  {
    category: "campaigns",
    q: "Can I donate to the same campaign multiple times?",
    a: "Yes! You can donate to the same campaign as many times as you like, whether monetary or item donations.",
  },

  {
    category: "security",
    q: "Is my personal information safe?",
    a: "Yes. We take your privacy seriously. Your personal information is encrypted and never shared with third parties without your consent.",
  },
  {
    category: "security",
    q: "Are the foundations on FoundationLink verified?",
    a: "Yes. All foundations go through a verification process by our administrators before they can create campaigns and receive donations.",
  },
  {
    category: "security",
    q: "What should I do if I notice suspicious activity?",
    a: "Contact our support team immediately at support@foundationlink.com. Change your password right away from your Profile page.",
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<CategoryKey>("getting-started");
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const filteredFaqs = search
    ? FAQS.filter(
        (f) =>
          f.q.toLowerCase().includes(search.toLowerCase()) ||
          f.a.toLowerCase().includes(search.toLowerCase())
      )
    : FAQS.filter((f) => f.category === activeCategory);

  function toggle(q: string) {
    setOpenFaq(openFaq === q ? null : q);
  }

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0F2D52" />
        </TouchableOpacity>
        <Text style={styles.title}>Help Center</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heroTitle}>How can we help you?</Text>
        <Text style={styles.heroSub}>
          Search for answers or browse topics below
        </Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search help topics..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {!search && (
          <View style={styles.quickGrid}>
            {QUICK_LINKS.map((q) => (
              <TouchableOpacity
                key={q.title}
                style={styles.quickCard}
                onPress={() => setActiveCategory(q.category)}
              >
                <Text style={styles.quickIcon}>{q.icon}</Text>
                <Text style={styles.quickTitle}>{q.title}</Text>
                <Text style={styles.quickDesc}>{q.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!search && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.catRow}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.catBtn,
                  activeCategory === cat.key && styles.catBtnActive,
                ]}
                onPress={() => setActiveCategory(cat.key)}
              >
                <Text style={styles.catIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.catText,
                    activeCategory === cat.key && styles.catTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {filteredFaqs.length === 0 ? (
          <EmptyState
            icon="search-outline"
            message={`No results found for "${search}"`}
            card={false}
          />
        ) : (
          <View style={{ gap: 8, marginTop: 14 }}>
            {filteredFaqs.map((faq) => (
              <View
                key={faq.q}
                style={[
                  styles.faqItem,
                  openFaq === faq.q && styles.faqItemOpen,
                ]}
              >
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggle(faq.q)}
                >
                  <Text
                    style={[
                      styles.faqQuestionText,
                      openFaq === faq.q && styles.faqQuestionTextOpen,
                    ]}
                  >
                    {faq.q}
                  </Text>
                  <Ionicons
                    name={openFaq === faq.q ? "chevron-up" : "chevron-down"}
                    size={16}
                    color={openFaq === faq.q ? "#1a8a52" : "#94a3b8"}
                  />
                </TouchableOpacity>
                {openFaq === faq.q && (
                  <Text style={styles.faqAnswer}>{faq.a}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* CONTACT SECTION */}
        <View style={styles.contactSection}>
          <View style={styles.contactCard}>
            <Text style={styles.contactIcon}>📧</Text>
            <Text style={styles.contactTitle}>Still need help?</Text>
            <Text style={styles.contactDesc}>
              Our support team is ready to assist you.
            </Text>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => router.push("/contact")}
            >
              <Text style={styles.contactBtnText}>Contact Support</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contactCard}>
            <Text style={styles.contactIcon}>📋</Text>
            <Text style={styles.contactTitle}>Terms of Service</Text>
            <Text style={styles.contactDesc}>
              Read our terms and conditions.
            </Text>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => router.push("/terms")}
            >
              <Text style={styles.contactBtnText}>View Terms</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contactCard}>
            <Text style={styles.contactIcon}>🔒</Text>
            <Text style={styles.contactTitle}>Privacy Policy</Text>
            <Text style={styles.contactDesc}>
              Learn how we protect your data.
            </Text>
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => router.push("/privacy")}
            >
              <Text style={styles.contactBtnText}>View Policy</Text>
            </TouchableOpacity>
          </View>
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

  heroTitle: {
    fontFamily: "Nunito_900Black",
    fontSize: 20,
    color: "#0e5c36",
    textAlign: "center",
    marginBottom: 4,
  },
  heroSub: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    color: "#475569",
    textAlign: "center",
    marginBottom: 16,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13.5,
    color: "#0F2D52",
  },

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  quickCard: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    shadowColor: "#005028",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  quickIcon: { fontSize: 26, marginBottom: 6 },
  quickTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 12.5,
    color: "#0F2D52",
    marginBottom: 2,
    textAlign: "center",
  },
  quickDesc: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 10.5,
    color: "#94a3b8",
    textAlign: "center",
  },

  catRow: { marginBottom: 6 },
  catBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
  },
  catBtnActive: { backgroundColor: "#1a8a52" },
  catIcon: { fontSize: 13 },
  catText: { fontFamily: "Nunito_700Bold", fontSize: 11.5, color: "#475569" },
  catTextActive: { color: "#fff" },

  faqItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  faqItemOpen: { borderColor: "#1a8a52" },
  faqQuestion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    gap: 10,
  },
  faqQuestionText: {
    flex: 1,
    fontFamily: "Nunito_700Bold",
    fontSize: 13,
    color: "#0F2D52",
  },
  faqQuestionTextOpen: { color: "#1a8a52" },
  faqAnswer: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12.5,
    color: "#475569",
    lineHeight: 20,
    paddingHorizontal: 15,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "#f0fdf4",
    paddingTop: 10,
  },

  contactSection: { gap: 12, marginTop: 24 },
  contactCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#005028",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  contactIcon: { fontSize: 26, marginBottom: 8 },
  contactTitle: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 13.5,
    color: "#0F2D52",
    marginBottom: 4,
  },
  contactDesc: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11.5,
    color: "#94a3b8",
    marginBottom: 12,
  },
  contactBtn: {
    backgroundColor: "#1a8a52",
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  contactBtnText: { fontFamily: "Nunito_700Bold", fontSize: 12, color: "#fff" },
});
