import { Ionicons } from "@expo/vector-icons";
import {
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

type Props = {
  uri: string | null;
  onClose: () => void;
};

export default function Lightbox({ uri, onClose }: Props) {
  const { width, height } = Dimensions.get("window");

  return (
    <Modal
      visible={!!uri}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        {uri && (
          <Image
            source={{ uri }}
            style={{ width: width * 0.92, height: height * 0.7 }}
            resizeMode="contain"
          />
        )}
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
});
