import { useEffect } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../lib/auth";
import { CartProvider } from "../lib/cart";
import { ActivityProvider } from "../lib/activity";
import { registerForPush } from "../lib/push";
import { useTheme } from "../lib/theme";

function PushBridge() {
  const { user } = useAuth();
  useEffect(() => { if (user) registerForPush(user.id); }, [user?.id]);
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => router.push("/espace"));
    return () => sub.remove();
  }, []);
  return null;
}

function Nav() {
  const t = useTheme();
  const header = { headerStyle: { backgroundColor: t.surface }, headerTintColor: t.ink, headerTitleStyle: { fontWeight: "800" }, contentStyle: { backgroundColor: t.bg }, headerBackTitle: "Retour" };
  return (
    <>
      <StatusBar style={t.dark ? "light" : "dark"} />
      <PushBridge />
      <Stack screenOptions={header}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="salon/[id]" options={{ title: "Salon" }} />
        <Stack.Screen name="reserver/[id]" options={{ title: "Prendre rendez-vous", presentation: "modal" }} />
        <Stack.Screen name="panier" options={{ title: "Mon panier", presentation: "modal" }} />
        <Stack.Screen name="avis/[bookingId]" options={{ title: "Mon avis", presentation: "modal" }} />
        <Stack.Screen name="connexion" options={{ title: "Connexion", presentation: "modal" }} />
        <Stack.Screen name="pro/salon" options={{ title: "Mon salon" }} />
        <Stack.Screen name="pro/boutique" options={{ title: "Ma boutique de mèches" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ActivityProvider>
          <CartProvider>
            <Nav />
          </CartProvider>
        </ActivityProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
