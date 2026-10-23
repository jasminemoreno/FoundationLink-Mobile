import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

// Same rules as the server (and the register screen): at least 12 characters,
// one number and one special character.
export const PASSWORD_MIN_LENGTH = 12;

export function passwordChecks(password: string) {
  return [
    {
      label: `At least ${PASSWORD_MIN_LENGTH} characters`,
      met: password.length >= PASSWORD_MIN_LENGTH,
    },
    { label: "At least 1 number", met: /[0-9]/.test(password) },
    {
      label: "At least 1 special character (e.g. !@#$%)",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];
}

export function isStrongPassword(password: string) {
  return passwordChecks(password).every((rule) => rule.met);
}

function Row({ label, met }: { label: string; met: boolean }) {
  return (
    <View style={styles.row}>
      <Ionicons
        name={met ? "checkmark-circle" : "ellipse-outline"}
        size={15}
        color={met ? "#059669" : "#94a3b8"}
      />
      <Text style={[styles.text, met && styles.textMet]}>{label}</Text>
    </View>
  );
}

/** Live checklist shown under a "new password" box. */
export default function PasswordChecklist({ password }: { password: string }) {
  return (
    <View style={styles.wrap}>
      {passwordChecks(password).map((rule) => (
        <Row key={rule.label} label={rule.label} met={rule.met} />
      ))}
    </View>
  );
}

/** "Passwords match" line shown under the confirm box once something is typed. */
export function PasswordMatch({
  password,
  confirmation,
}: {
  password: string;
  confirmation: string;
}) {
  if (!confirmation) return null;
  const match = password === confirmation;
  return (
    <View style={styles.wrap}>
      <Row
        label={match ? "Passwords match" : "Passwords do not match yet"}
        met={match}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, marginTop: 8, marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  text: {
    fontFamily: "Nunito_600SemiBold",
    fontSize: 12,
    color: "#64748b",
  },
  textMet: { color: "#059669" },
});
