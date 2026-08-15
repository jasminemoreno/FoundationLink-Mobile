import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  icon?: keyof typeof Ionicons.glyphMap;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  card?: boolean;
};

export default function EmptyState({
  icon = "file-tray-outline",
  message,
  actionLabel,
  onAction,
  card = true,
}: Props) {
  return (
    <View style={[styles.wrap, card && styles.card]}>
      <Ionicons name={icon} size={34} color="#94a3b8" />
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.action} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", padding: 32, gap: 8 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    shadowColor: "#005028",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  message: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
  },
  action: {
    marginTop: 4,
    backgroundColor: "#1a8a52",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  actionText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 13,
    color: "#fff",
  },
});
