import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type Props = {
  liked: boolean;
  count: number;
  onToggle: () => void;
};

export default function ReactionButton({ liked, count, onToggle }: Props) {
  return (
    <TouchableOpacity
      style={[styles.btn, liked && styles.btnLiked]}
      onPress={onToggle}
    >
      <Ionicons
        name={liked ? "heart" : "heart-outline"}
        size={15}
        color={liked ? "#db2777" : "#64748b"}
      />
      <Text style={[styles.text, liked && styles.textLiked]}>{count}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  btnLiked: { backgroundColor: "#fdf2f8" },
  text: { fontFamily: "Nunito_800ExtraBold", fontSize: 11.5, color: "#64748b" },
  textLiked: { color: "#db2777" },
});
