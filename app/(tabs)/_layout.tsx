import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import DonorHeader from "../../components/DonorHeader";
import { useAuth } from "../../context/AuthContext";

export default function TabsLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.wrap}>
      <DonorHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#1a8a52",
          tabBarInactiveTintColor: "#9aaea6",
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="campaigns"
          options={{
            title: "Campaigns",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "megaphone" : "megaphone-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="foundations"
          options={{
            title: "Foundations",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "business" : "business-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="my-donations"
          options={{
            title: "My Donations",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "heart" : "heart-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#fff" },
});
