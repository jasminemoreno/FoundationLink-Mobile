import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Section = {
  heading: string;
  body: string;
  link?: { text: string; href: string };
};

type Props = {
  title: string;
  sections: Section[];
};

export default function LegalDocPage({ title, sections }: Props) {
  const router = useRouter();

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#0F2D52" />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {sections.map((s, i) => (
            <View key={i} style={i > 0 ? styles.section : undefined}>
              <Text style={styles.heading}>{s.heading}</Text>
              <Text style={styles.body}>
                {s.body}
                {s.link ? (
                  <Text
                    style={styles.link}
                    onPress={() => Linking.openURL(s.link!.href)}
                  >
                    {" "}
                    {s.link.text}
                  </Text>
                ) : null}
              </Text>
            </View>
          ))}
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

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#005028",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  section: { marginTop: 18 },
  heading: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 14,
    color: "#0F2D52",
    marginBottom: 8,
  },
  body: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "#475569",
    lineHeight: 21,
  },
  link: { fontFamily: "Nunito_700Bold", color: "#1a8a52" },
});
