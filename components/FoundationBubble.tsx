import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getImageUrl } from "../services/api";
import { Foundation } from "../types/donortypes";

type Props = {
  foundation: Foundation;
  onPress: () => void;
};

export default function FoundationBubble({ foundation, onPress }: Props) {
  const logoUrl = getImageUrl(foundation.logo);

  return (
    <TouchableOpacity style={styles.wrap} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.ring}>
        <View style={styles.circle}>
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={styles.img} />
          ) : (
            <Text style={styles.initials}>{foundation.initials}</Text>
          )}
        </View>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {foundation.name}
      </Text>
      <Text style={styles.meta}>{foundation.active_campaigns ?? 0} active</Text>
    </TouchableOpacity>
  );
}

const SIZE = 64;

const styles = StyleSheet.create({
  wrap: { alignItems: "center", width: 84 },
  ring: {
    padding: 3,
    borderRadius: 999,
    backgroundColor: "#7eedc7",
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: "#0e5c36",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    overflow: "hidden",
  },
  img: { width: "100%", height: "100%" },
  initials: { fontFamily: "Nunito_900Black", fontSize: 18, color: "#fff" },
  name: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 11,
    color: "#0F2D52",
    marginTop: 6,
    textAlign: "center",
  },
  meta: {
    fontFamily: "Nunito_700Bold",
    fontSize: 9,
    color: "#1a8a52",
    marginTop: 1,
  },
});
