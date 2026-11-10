import { Stack, router, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Image, Platform, Pressable, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../lib/auth";
import { CartProvider, useCart } from "../lib/cart";
import { ActivityProvider, useActivity } from "../lib/activity";
import { useTheme } from "../lib/theme";

function DesktopNavItem({ label, icon, href, active, t, badge }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={() => router.push(href)}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderRadius: 999,
        backgroundColor: active ? t.chip : "transparent",
        opacity: pressed ? 0.72 : 1,
      })}
    >
      <Ionicons name={icon} size={18} color={active ? t.accent : t.muted} />
      <Text style={{ color: active ? t.accent : t.ink, fontWeight: active ? "800" : "600", fontSize: 14 }}>
        {label}
      </Text>
      {badge ? (
        <View style={{ minWidth: 19, height: 19, borderRadius: 10, paddingHorizontal: 5, backgroundColor: t.accent, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: t.accentInk, fontSize: 11, fontWeight: "800" }}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function DesktopHeader({ t, pathname, pending, cartCount }) {
  const links = [
    { label: "Accueil", href: "/", icon: "home-outline", match: pathname === "/" },
    { label: "Coiffeuses", href: "/coiffeuses", icon: "cut-outline", match: pathname.startsWith("/coiffeuses") || pathname.startsWith("/salon/") || pathname.startsWith("/reserver/") },
    { label: "Mèches", href: "/meches", icon: "bag-handle-outline", match: pathname.startsWith("/meches") || pathname.startsWith("/panier") },
    { label: "Mon espace", href: "/espace", icon: "person-circle-outline", match: pathname.startsWith("/espace") || pathname.startsWith("/connexion") || pathname.startsWith("/pro/"), badge: pending },
  ];

  return (
    <View style={{ backgroundColor: t.surface, borderBottomWidth: 1, borderBottomColor: t.line, zIndex: 10 }}>
      <View style={{ width: "100%", maxWidth: 1240, minHeight: 76, alignSelf: "center", paddingHorizontal: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 18 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace("/")}
          style={{ flexDirection: "row", alignItems: "center", gap: 10, minWidth: 150 }}
        >
          <Image source={require("../assets/logo.png")} accessibilityLabel="Logo Kitoko" style={{ width: 38, height: 38, borderRadius: 9 }} />
          <View>
            <Text style={{ color: t.ink, fontSize: 21, fontWeight: "900", letterSpacing: -0.5 }}>KITOKO</Text>
            <Text style={{ color: t.muted, fontSize: 10, letterSpacing: 1.1, textTransform: "uppercase" }}>Beauté afro en Belgique</Text>
          </View>
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", gap: 4, flex: 1 }}>
          {links.map((item) => (
            <DesktopNavItem
              key={item.href}
              label={item.label}
              icon={item.icon}
              href={item.href}
              t={t}
              active={item.match}
              badge={item.badge ? (item.badge > 9 ? "9+" : item.badge) : null}
            />
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/panier")}
            style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 15, paddingVertical: 11, marginLeft: 4, borderRadius: 999, backgroundColor: t.accent, opacity: pressed ? 0.8 : 1 })}
          >
            <Ionicons name="cart-outline" size={18} color={t.accentInk} />
            <Text style={{ color: t.accentInk, fontSize: 14, fontWeight: "800" }}>Panier{cartCount ? ` · ${cartCount}` : ""}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Nav() {
  const t = useTheme();
  const pathname = usePathname();
  const { pending } = useActivity();
  const cart = useCart();
  const { width } = useWindowDimensions();
  const desktopWeb = Platform.OS === "web" && width >= 900;

  const header = {
    headerStyle: { backgroundColor: t.surface },
    headerTintColor: t.ink,
    headerTitleStyle: { fontWeight: "800" },
    contentStyle: { backgroundColor: t.bg },
    headerBackTitle: "Retour",
    headerShown: !desktopWeb,
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style={t.dark ? "light" : "dark"} />
      {desktopWeb ? <DesktopHeader t={t} pathname={pathname} pending={pending} cartCount={cart.count} /> : null}
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
    </View>
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
