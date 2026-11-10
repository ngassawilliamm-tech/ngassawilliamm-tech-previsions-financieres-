import { Tabs } from "expo-router";
import { Ionicons } from "../../lib/icons";
import { Platform, useWindowDimensions } from "react-native";
import { useTheme } from "../../lib/theme";
import { useActivity } from "../../lib/activity";
import { useScreenWidth } from "../../lib/useScreenWidth";

export default function TabsLayout() {
  const t = useTheme();
  const { pending } = useActivity();
  const { width } = useScreenWidth();
  const desktopWeb = Platform.OS === "web" && width >= 900;
  const icon = (name) => ({ color, size }) => <Ionicons name={name} color={color} size={size} />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: desktopWeb
          ? { display: "none" }
          : { backgroundColor: t.surface, borderTopColor: t.line },
        headerShown: !desktopWeb,
        headerStyle: { backgroundColor: t.surface },
        headerTintColor: t.ink,
        headerTitleStyle: { fontWeight: "800" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Accueil", headerShown: false, tabBarIcon: icon("home-outline") }} />
      <Tabs.Screen name="coiffeuses" options={{ title: "Coiffeuses", tabBarIcon: icon("cut-outline") }} />
      <Tabs.Screen name="meches" options={{ title: "Mèches", tabBarIcon: icon("bag-handle-outline") }} />
      <Tabs.Screen name="espace" options={{
        title: "Mon espace",
        tabBarIcon: icon("person-circle-outline"),
        tabBarBadge: pending ? pending : undefined,
        tabBarBadgeStyle: { backgroundColor: t.accent, color: t.accentInk }
      }} />
    </Tabs>
  );
}
