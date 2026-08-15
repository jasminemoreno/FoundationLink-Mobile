import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getImageUrl } from "../services/api";

type UserLike = {
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_photo?: string | null;
} | null;

type Props = {
  visible: boolean;
  user: UserLike;
  topOffset: number;
  onClose: () => void;
  onProfile: () => void;
  onDonations: () => void;
  onLogout: () => void;
};

export default function ProfileDropdown({
  visible,
  user,
  topOffset,
  onClose,
  onProfile,
  onDonations,
  onLogout,
}: Props) {
  const initials =
    `${user?.first_name?.[0] ?? ""}${
      user?.last_name?.[0] ?? ""
    }`.toUpperCase() || "D";
  const photoUrl = getImageUrl(user?.profile_photo);

  function handle(action: () => void) {
    onClose();
    action();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.dropdown, { top: topOffset + 6 }]}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {user?.first_name} {user?.last_name}
              </Text>
              <Text style={styles.email} numberOfLines={1}>
                {user?.email}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.item}
            onPress={() => handle(onProfile)}
          >
            <Ionicons name="person-outline" size={16} color="#9caba3" />
            <Text style={styles.itemText}>My Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.item}
            onPress={() => handle(onDonations)}
          >
            <Ionicons name="heart-outline" size={16} color="#9caba3" />
            <Text style={styles.itemText}>My Donations</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.item}
            onPress={() => handle(onLogout)}
          >
            <Ionicons name="log-out-outline" size={16} color="#ef8f8f" />
            <Text style={[styles.itemText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.15)" },
  dropdown: {
    position: "absolute",
    right: 16,
    width: 250,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#edf6f0",
    overflow: "hidden",
    shadowColor: "#002814",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 16,
    backgroundColor: "#f0fdf4",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#1a8a52",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarText: {
    fontFamily: "Nunito_800ExtraBold",
    fontSize: 13,
    color: "#fff",
  },
  name: { fontFamily: "Nunito_700Bold", fontSize: 13.5, color: "#0F2D52" },
  email: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 1,
  },

  divider: { height: 1, backgroundColor: "#f1f5f9" },

  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  itemText: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 13,
    color: "#47605a",
  },
  logoutText: { color: "#dc2626" },
});
