import { Ionicons } from "@expo/vector-icons";
import { StyleProp, TouchableOpacity, ViewStyle } from "react-native";

/**
 * The "show/hide password" button for a password box. Like the login screen:
 * an eye while the password is hidden (tap to show), a crossed-out eye while
 * it is visible (tap to hide). Each screen positions it with `style`.
 */
export default function PasswordToggle({
  visible,
  onPress,
  style,
  color = "#94a3b8",
}: {
  visible: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  color?: string;
}) {
  return (
    <TouchableOpacity
      style={style}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={visible ? "Hide password" : "Show password"}
    >
      <Ionicons
        name={visible ? "eye-off-outline" : "eye-outline"}
        size={18}
        color={color}
      />
    </TouchableOpacity>
  );
}
