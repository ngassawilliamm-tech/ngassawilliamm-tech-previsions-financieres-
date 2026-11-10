import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  View, Text, Animated, Easing, Pressable, FlatList, TextInput, Platform, Modal, Image,
  useWindowDimensions, AccessibilityInfo, RefreshControl
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useTheme, R } from "../../lib/theme";
import {
  Btn, Title, Muted, Eyebrow, Avatar, Rating,
  Row, Chip, Swatch, Body, Select
} from "../../components/ui";
import { euro, CITIES, POPULAR_CITIES } from "../../lib/constants";
import { Portrait, PortraitAvatar, PEOPLE } from "../../components/Portrait";
import { PHOTOS } from "../../lib/photos";

const CITY_KEY = "kitoko.ville";
const USE_NATIVE = Platform.OS !== "web";

const WORDS = [
  "knotless", "box braids", "locks", "twists",
  "cornrows", "faux locs", "tissages", "French curls"
];

const MARQUEE = [
  "Box braids", "Knotless", "Cornrows", "Twists",
  "Locks", "Faux locs", "French curl", "Crochet braids",
  "Tissage", "Lace wig", "Soins 4C", "Coiffure enfants", "Mariage"
];

// Tuiles « Explorer par style » : le style correspond à STYLES dans lib/constants.js
const STYLE_TILES = [
  { style: "Knotless", label: "Knotless", icon: "sparkles-outline", colors: ["#7B1E48", "#B23A6F"] },
  { style: "Box braids", label: "Box braids", icon: "grid-outline", colors: ["#B7790B", "#D9A441"] },
  { style: "Locks / dreadlocks", label: "Locks", icon: "infinite-outline", colors: ["#1F6B7A", "#3B97A6"] },
  { style: "Cornrows / nattes collées", label: "Cornrows", icon: "git-branch-outline", colors: ["#5B3A8C", "#8360B8"] },
  { style: "Twists", label: "Twists", icon: "sync-outline", colors: ["#9C3D1B", "#C9643C"] },
  { style: "Perruque / lace wig", label: "Lace wig", icon: "happy-outline", colors: ["#2E6B3F", "#4F9A63"] },
  { style: "Soins cheveux naturels", label: "Soins naturels", icon: "leaf-outline", colors: ["#7A4E2D", "#A8774E"] },
  { style: "Coiffure de mariage", label: "Mariage", icon: "heart-outline", colors: ["#8C2F4E", "#C25B7D"] }
];

const STEPS = [
  ["calendar-outline", "Réserve", "Choisis ta coiffeuse, ta coiffure, ta date. Elle valide dans son espace."],
  ["cube-outline", "Fais livrer tes mèches", "Le fournisseur livre au salon, avant ta séance."],
  ["star-outline", "Note ta séance", "Étoiles, satisfaite ou pas : tu aides les autres clientes."]
];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Bonne nuit";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function useReduceMotion() {
  const [r, setR] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setR).catch(() => {});
    const s = AccessibilityInfo.addEventListener("reduceMotionChanged", setR);
    return () => s?.remove?.();
  }, []);

  return r;
}

// ─────────────────────────────────────────────────────────────
// Animations de décor
// ─────────────────────────────────────────────────────────────

function Braid({ width, colors, reduce, height = 56, amp = 14, dots = 30, size = 12 }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: 3200, easing: Easing.linear, useNativeDriver: USE_NATIVE })
    );
    loop.start();
    return () => loop.stop();
  }, [reduce]);

  const step = width / dots;
  const items = [];

  for (let s = 0; s < 3; s++) {
    for (let i = 0; i <= dots; i++) {
      const phase = i * 0.42 + (s * 2 * Math.PI) / 3;
      const ys = [0, 0.25, 0.5, 0.75, 1].map((k) => amp * Math.sin(phase + k * 2 * Math.PI));
      const zs = [0, 0.25, 0.5, 0.75, 1].map((k) => 0.8 + 0.25 * Math.cos(phase + k * 2 * Math.PI));

      items.push(
        <Animated.View
          key={`${s}-${i}`}
          style={{
            position: "absolute",
            left: i * step - size / 2,
            top: height / 2 - size / 2,
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors[s],
            opacity: 0.9,
            transform: reduce
              ? [{ translateY: ys[0] }]
              : [
                  { translateY: t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ys }) },
                  { scale: t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: zs }) }
                ]
          }}
        />
      );
    }
  }

  return <View pointerEvents="none" style={{ height, width, overflow: "hidden" }}>{items}</View>;
}

function RotatingWord({ color, reduce }) {
  const [i, setI] = useState(0);
  const y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setInterval(() => {
      if (reduce) {
        setI((x) => (x + 1) % WORDS.length);
        return;
      }
      Animated.timing(y, { toValue: -1, duration: 260, useNativeDriver: USE_NATIVE, easing: Easing.in(Easing.quad) }).start(() => {
        setI((x) => (x + 1) % WORDS.length);
        y.setValue(1);
        Animated.timing(y, { toValue: 0, duration: 380, useNativeDriver: USE_NATIVE, easing: Easing.out(Easing.cubic) }).start();
      });
    }, 2400);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <View style={{ overflow: "hidden", height: 50 }}>
      <Animated.Text
        style={{
          color,
          fontSize: 44,
          fontWeight: "800",
          fontStyle: "italic",
          letterSpacing: -1.2,
          transform: [{ translateY: y.interpolate({ inputRange: [-1, 1], outputRange: [-50, 50] }) }]
        }}
      >
        {WORDS[i]}
      </Animated.Text>
    </View>
  );
}

function Marquee({ t, reduce }) {
  const x = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(0);

  useEffect(() => {
    if (!w || reduce) return;
    const loop = Animated.loop(
      Animated.timing(x, { toValue: -w, duration: w * 28, easing: Easing.linear, useNativeDriver: USE_NATIVE })
    );
    loop.start();
    return () => loop.stop();
  }, [w, reduce]);

  const row = (k) => (
    <View key={k} style={{ flexDirection: "row" }} onLayout={k === 0 ? (e) => setW(e.nativeEvent.layout.width) : undefined}>
      {MARQUEE.map((m) => (
        <Text key={m} style={{ color: t.bg, fontWeight: "800", fontSize: 17, marginRight: 22 }}>
          {m}{"  "}<Text style={{ color: t.gold }}>✦</Text>
        </Text>
      ))}
    </View>
  );

  return (
    <View style={{ backgroundColor: t.ink, paddingVertical: 12, overflow: "hidden" }}>
      <Animated.View style={{ flexDirection: "row", transform: [{ translateX: x }] }}>
        {row(0)}
        {row(1)}
      </Animated.View>
    </View>
  );
}

function Counter({ value, label, icon, t, reduce, w = "48%" }) {
  const a = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (reduce) {
      setShown(value);
      return;
    }
    const id = a.addListener(({ value: v }) => setShown(Math.round(v)));
    Animated.timing(a, { toValue: value, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => a.removeListener(id);
  }, [value, reduce]);

  return (
    <View
      style={{
        width: w,
        marginBottom: 10,
        padding: 14,
        borderRadius: R.md,
        backgroundColor: t.dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)",
        borderWidth: 1,
        borderColor: t.line,
        gap: 4
      }}
    >
      <Ionicons name={icon} size={18} color={t.gold} />
      <Text style={{ color: t.ink, fontSize: 30, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{shown}</Text>
      <Text style={{ color: t.muted, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

// Apparition en fondu + léger glissement vers le haut
function Rise({ children, delay = 0, reduce, style, from = 26 }) {
  const progress = useRef(new Animated.Value(reduce ? 1 : 0)).current;

  useEffect(() => {
    if (reduce) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1, delay, duration: 720, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE
    });
    animation.start();
    return () => animation.stop();
  }, [delay, reduce, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) },
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) }
          ]
        }
      ]}
    >
      {children}
    </Animated.View>
  );
}

// Carte qui rebondit légèrement quand on appuie dessus
function PressScale({ children, onPress, style, accessibilityLabel }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v, bounciness) =>
    Animated.spring(scale, { toValue: v, speed: 22, bounciness, useNativeDriver: USE_NATIVE }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => to(0.96, 4)}
      onPressOut={() => to(1, 8)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

function FloatingOrb({ size, color, top, right, bottom, left, delay = 0, reduce }) {
  const motion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(motion, { toValue: 1, duration: 3600, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE }),
        Animated.timing(motion, { toValue: 0, duration: 3600, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, reduce, motion]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute", top, right, bottom, left,
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color,
        opacity: motion.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.13] }),
        transform: [
          { translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [10, -18] }) },
          { scale: motion.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] }) }
        ]
      }}
    />
  );
}

function PulseDot({ color, reduce }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE })
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, pulse]);

  return (
    <View style={{ width: 8, height: 8, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: color,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) }]
        }}
      />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

// Bloc gris animé affiché pendant le chargement
function Skeleton({ width, height, radius = 10, t, reduce, style }) {
  const v = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: USE_NATIVE }),
        Animated.timing(v, { toValue: 0.45, duration: 700, useNativeDriver: USE_NATIVE })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, v]);

  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: t.chip, opacity: v }, style]} />;
}

// ─────────────────────────────────────────────────────────────
// Blocs de la page
// ─────────────────────────────────────────────────────────────

// Petite barre qui apparaît en haut quand on fait défiler la page
function StickyBar({ scrollY, t, insets, city, onCity }) {
  const opacity = scrollY.interpolate({ inputRange: [220, 300], outputRange: [0, 1], extrapolate: "clamp" });
  const translateY = scrollY.interpolate({ inputRange: [220, 300], outputRange: [-12, 0], extrapolate: "clamp" });

  return (
    <Animated.View
      style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
        paddingTop: insets.top + 8, paddingBottom: 10, paddingHorizontal: 20,
        backgroundColor: t.surface, borderBottomWidth: 1, borderBottomColor: t.line,
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        opacity, transform: [{ translateY }],
        shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4
      }}
    >
      <Row wrap={false} gap={8}>
        <Image source={require("../../assets/logo.png")} accessibilityLabel="Logo Kitoko" style={{ width: 28, height: 28, borderRadius: 7 }} />
        <Text style={{ color: t.ink, fontWeight: "800", fontSize: 18 }}>Kitoko</Text>
      </Row>
      <Pressable onPress={onCity} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: R.pill, backgroundColor: t.chip }}>
        <Ionicons name="location" size={14} color={t.accent} />
        <Text style={{ color: t.ink, fontWeight: "700", fontSize: 13 }}>{city || "Toute la Belgique"}</Text>
      </Pressable>
    </Animated.View>
  );
}

// Carte de recherche : texte + ville
function SearchCard({ t, city, setCity }) {
  const [q, setQ] = useState("");
  const go = () =>
    router.push({ pathname: "/coiffeuses", params: { q: q.trim(), ville: city || "" } });

  return (
    <View
      style={{
        backgroundColor: t.surface, borderRadius: R.lg, padding: 14, gap: 10,
        borderWidth: 1, borderColor: t.line,
        shadowColor: t.accent, shadowOpacity: 0.12, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 5
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: t.bg, borderRadius: R.pill, paddingHorizontal: 14, borderWidth: 1, borderColor: t.line }}>
        <Ionicons name="search" size={18} color={t.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          onSubmitEditing={go}
          returnKeyType="search"
          placeholder="Knotless, nom du salon, quartier…"
          placeholderTextColor={t.muted}
          style={{ flex: 1, color: t.ink, fontSize: 16, paddingVertical: 12 }}
        />
      </View>
      <Select
        value={city}
        onChange={setCity}
        placeholder="📍 Toute la Belgique"
        options={[{ label: "📍 Toute la Belgique", value: "" }, ...CITIES.map((c) => ({ label: "📍 " + c, value: c }))]}
      />
      <Btn title="Rechercher" onPress={go} />
    </View>
  );
}

// Bandeau horizontal des villes, avec le nombre de salons
function CityStrip({ t, city, setCity, counts, onMore, reduce }) {
  const list = useMemo(() => {
    const withSalons = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
    const extra = POPULAR_CITIES.filter((c) => !counts[c]);
    const rest = [...withSalons, ...extra].filter((c) => c !== city);
    // La ville choisie passe juste après « Toute la Belgique »
    return city ? ["", city, ...rest] : ["", ...rest];
  }, [counts, city]);

  const ref = useRef(null);
  useEffect(() => { ref.current?.scrollToOffset?.({ offset: 0, animated: !reduce }); }, [city]);

  return (
    <FlatList
      ref={ref}
      horizontal
      data={["__more", ...list]}
      keyExtractor={(c) => c || "__all"}
      initialNumToRender={list.length + 1}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      renderItem={({ item: c, index }) => {
        if (c === "__more") {
          return (
            <Rise delay={index * 40} reduce={reduce} from={12}>
              <PressScale onPress={onMore} accessibilityLabel="Toutes les villes"
                style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: R.pill, borderWidth: 1, borderStyle: "dashed", borderColor: t.muted }}>
                <Ionicons name="search" size={15} color={t.ink} />
                <Text style={{ color: t.ink, fontWeight: "700" }}>Toutes les villes ({CITIES.length})</Text>
              </PressScale>
            </Rise>
          );
        }
        const active = city === c;
        const n = c ? counts[c] || 0 : Object.values(counts).reduce((a, b) => a + b, 0);
        return (
          <Rise delay={index * 40} reduce={reduce} from={12}>
            <PressScale
              onPress={() => setCity(c)}
              accessibilityLabel={c || "Toute la Belgique"}
              style={{
                flexDirection: "row", alignItems: "center", gap: 6,
                paddingHorizontal: 14, paddingVertical: 10, borderRadius: R.pill,
                backgroundColor: active ? t.accent : t.surface,
                borderWidth: 1, borderColor: active ? t.accent : t.line
              }}
            >
              <Ionicons name={c ? "location-outline" : "globe-outline"} size={15} color={active ? t.accentInk : t.accent} />
              <Text style={{ color: active ? t.accentInk : t.ink, fontWeight: "700" }}>{c || "Toute la Belgique"}</Text>
              <View style={{ minWidth: 20, paddingHorizontal: 6, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: active ? "rgba(255,255,255,0.25)" : t.chip }}>
                <Text style={{ color: active ? t.accentInk : t.muted, fontSize: 11, fontWeight: "800" }}>{n}</Text>
              </View>
            </PressScale>
          </Rise>
        );
      }}
    />
  );
}

function StyleGrid({ t, width, city, reduce }) {
  const cols = width >= 900 ? 4 : 2;
  const gap = 12;
  const inner = Math.min(width, 1240) - 40;
  const w = (inner - gap * (cols - 1)) / cols;

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap, paddingHorizontal: 20 }}>
      {STYLE_TILES.map((s, i) => (
        <Rise key={s.style} delay={120 + i * 60} reduce={reduce}>
          <PressScale
            onPress={() => router.push({ pathname: "/coiffeuses", params: { style: s.style, ville: city || "" } })}
            accessibilityLabel={s.label}
            style={{ width: w, height: 104, borderRadius: R.md, overflow: "hidden" }}
          >
            <LinearGradient colors={s.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, padding: 14, justifyContent: "space-between" }}>
              <View style={{ position: "absolute", right: -18, bottom: -22, width: 90, height: 90, borderRadius: 45, borderWidth: 12, borderColor: "rgba(255,255,255,0.14)" }} />
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={s.icon} size={18} color="#fff" />
              </View>
              <Row wrap={false} style={{ justifyContent: "space-between" }}>
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>{s.label}</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </Row>
            </LinearGradient>
          </PressScale>
        </Rise>
      ))}
    </View>
  );
}

function Door({ kicker, title, text, cta, icon, onPress, t, tone, reduce }) {
  const orbit = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.timing(orbit, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: USE_NATIVE })
    );
    loop.start();
    return () => loop.stop();
  }, [orbit, reduce]);

  const rotate = orbit.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <PressScale
      onPress={onPress}
      accessibilityLabel={title}
      style={{
        backgroundColor: t.surface, borderColor: t.line, borderWidth: 1, borderRadius: R.lg,
        padding: 22, gap: 8, overflow: "hidden", minHeight: 190,
        shadowColor: tone, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 2
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute", right: -42, bottom: -48, width: 168, height: 168, borderRadius: 84,
          borderWidth: 18, borderColor: tone, borderStyle: "dashed", opacity: 0.25, transform: [{ rotate }]
        }}
      />
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: tone, alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
        <Ionicons name={icon} size={22} color="#fff" />
      </View>
      <Eyebrow>{kicker}</Eyebrow>
      <Title size={26} style={{ maxWidth: "82%" }}>{title}</Title>
      <Muted style={{ maxWidth: "78%" }}>{text}</Muted>
      <Text style={{ color: t.accent, fontWeight: "800", marginTop: 6 }}>{cta} →</Text>
    </PressScale>
  );
}

// « Comment ça marche » avec une ligne qui se remplit
function Steps({ t, reduce }) {
  const fill = useRef(new Animated.Value(reduce ? 1 : 0)).current;

  useEffect(() => {
    if (reduce) return;
    Animated.timing(fill, { toValue: 1, duration: 1400, delay: 400, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start();
  }, [reduce]);

  return (
    <View style={{ paddingHorizontal: 20 }}>
      <View style={{ position: "absolute", left: 20 + 21, top: 22, bottom: 22, width: 2, backgroundColor: t.line }} />
      <Animated.View
        style={{
          position: "absolute", left: 20 + 21, top: 22, width: 2, backgroundColor: t.accent,
          height: fill.interpolate({ inputRange: [0, 1], outputRange: ["0%", "82%"] })
        }}
      />
      {STEPS.map(([icon, a, b], i) => (
        <Rise key={a} delay={300 + i * 260} reduce={reduce} style={{ flexDirection: "row", gap: 14, alignItems: "flex-start", marginBottom: i < STEPS.length - 1 ? 18 : 0 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.accent, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: t.bg }}>
            <Ionicons name={icon} size={18} color={t.accentInk} />
          </View>
          <View style={{ flex: 1, gap: 2, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, borderRadius: R.md, padding: 14 }}>
            <Text style={{ color: t.gold, fontSize: 11, fontWeight: "800", letterSpacing: 1 }}>ÉTAPE {i + 1}</Text>
            <Body style={{ fontWeight: "800", fontSize: 17 }}>{a}</Body>
            <Muted>{b}</Muted>
          </View>
        </Rise>
      ))}
    </View>
  );
}

function SalonCard({ p, rating, t }) {
  const isNew = !rating || !Number(rating.n_reviews);
  return (
    <PressScale
      onPress={() => router.push(`/salon/${p.id}`)}
      accessibilityLabel={p.name}
      style={{ width: 260, backgroundColor: t.surface, borderRadius: R.lg, borderWidth: 1, borderColor: t.line, overflow: "hidden" }}
    >
      <LinearGradient
        colors={t.dark ? ["#3A2135", "#211824"] : [t.goldSoft, "#F6DCE6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ height: 70, paddingHorizontal: 14, paddingTop: 12, flexDirection: "row", justifyContent: "space-between" }}
      >
        {p.verified ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", backgroundColor: t.ok, paddingHorizontal: 8, paddingVertical: 4, borderRadius: R.pill }}>
            <Ionicons name="checkmark-circle" size={12} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>Vérifié</Text>
          </View>
        ) : <View />}
        {isNew ? (
          <View style={{ alignSelf: "flex-start", backgroundColor: t.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: R.pill }}>
            <Text style={{ color: t.accent, fontSize: 11, fontWeight: "800" }}>Nouveau</Text>
          </View>
        ) : null}
      </LinearGradient>
      <View style={{ padding: 14, paddingTop: 0, gap: 8, marginTop: -26 }}>
        <View style={{ borderWidth: 3, borderColor: t.surface, borderRadius: 30, alignSelf: "flex-start" }}>
          <Avatar name={p.name} size={50} />
        </View>
        <View>
          <Body numberOfLines={1} style={{ fontWeight: "800", fontSize: 17 }}>{p.name}</Body>
          <Row wrap={false} gap={4}>
            <Ionicons name="location-outline" size={13} color={t.muted} />
            <Muted numberOfLines={1} style={{ flex: 1 }}>{[p.area, p.city].filter(Boolean).join(" · ")}</Muted>
          </Row>
        </View>
        <Rating rating={rating} />
        <Row>
          {(p.styles || []).slice(0, 2).map((x) => <Chip key={x} label={x} tone="plain" />)}
        </Row>
        <Btn small title="Réserver" onPress={() => router.push(`/reserver/${p.id}`)} />
      </View>
    </PressScale>
  );
}

function SupplierCard({ s, t }) {
  const stock = (s.products || []).filter((p) => p.in_stock);
  const colors = [...new Set(stock.map((p) => p.color))].slice(0, 6);
  return (
    <PressScale
      onPress={() => router.push({ pathname: "/meches", params: { fournisseur: s.id } })}
      accessibilityLabel={s.name}
      style={{ width: 260, backgroundColor: t.surface, borderRadius: R.lg, borderWidth: 1, borderColor: t.line, padding: 16, gap: 10 }}
    >
      <Row wrap={false}>
        <Avatar name={s.name} seed={"m" + s.name} size={44} />
        <View style={{ flex: 1 }}>
          <Body numberOfLines={1} style={{ fontWeight: "800" }}>{s.name}</Body>
          <Muted>{s.city} · livre dans {s.zones?.length ?? 0} villes</Muted>
        </View>
      </Row>
      <Row>{colors.map((c) => <Swatch key={c} color={c} />)}</Row>
      <Row gap={6}>
        <Chip tone="gold" label={`${stock.length} produits`} />
        {(s.products || []).length ? <Chip tone="plain" label={`dès ${euro(Math.min(...s.products.map((p) => p.price)))}`} /> : null}
        {s.delay ? <Chip tone="ok" label={s.delay} /> : null}
      </Row>
    </PressScale>
  );
}


// Vraie photo qui zoome lentement (effet « Ken Burns »)
function ZoomPhoto({ source, width, height, reduce, delay = 0 }) {
  const z = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(z, { toValue: 1, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE }),
        Animated.timing(z, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduce]);
  return (
    <View style={{ width, height, overflow: "hidden" }}>
      <Animated.Image source={source} resizeMode="cover" style={{ width, height, transform: [{ scale: z.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }] }} />
    </View>
  );
}

// Photo de fond du haut de page : zoom et glissement lents + profondeur au défilement
function HeroBackground({ t, scrollY, reduce, desktop, width }) {
  const k = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(k, { toValue: 1, duration: 14000, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE }),
        Animated.timing(k, { toValue: 0, duration: 14000, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduce]);

  const scale = k.interpolate({ inputRange: [0, 1], outputRange: [1.04, 1.16] });
  const tx = k.interpolate({ inputRange: [0, 1], outputRange: [-18, 18] });
  const ty = scrollY.interpolate({ inputRange: [-200, 0, 600], outputRange: [-50, 0, 160], extrapolate: "clamp" });
  const rgb = t.dark ? "23,16,26" : "251,248,246";
  const a = (x) => `rgba(${rgb},${x})`;
  const fill = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 };

  // Site web sur ordinateur : les deux photos (même taille) fusionnées en une seule image,
  // avec un fondu progressif de l'une à l'autre au centre (assets/photos/fond-duo.jpg)
  if (desktop) {
    // L'image commence juste à droite du texte (colonne de 640 px dans le conteneur de 1240 px)
    const textRight = Math.max(0, (width - 1240) / 2) + 20 + 640;
    const left0 = textRight - 30;
    const scaleD = k.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.07] });
    const txD = k.interpolate({ inputRange: [0, 1], outputRange: [-10, 10] });
    return (
      <View pointerEvents="none" style={[fill, { overflow: "hidden" }]}>
        <View style={{ position: "absolute", top: 0, bottom: 0, left: left0, right: 0, overflow: "hidden" }}>
          <Animated.Image
            source={require("../../assets/photos/fond-duo.jpg")}
            resizeMode="cover"
            accessibilityLabel="Deux clientes aux tresses dans un salon Kitoko"
            style={[fill, { width: "100%", height: "100%", transform: [{ translateY: ty }, { translateX: txD }, { scale: scaleD }] }]}
          />
          {/* Fondu uniquement sur les bords extérieurs */}
          <LinearGradient colors={[a(1), a(0), a(0), a(0.6)]} locations={[0, 0.1, 0.92, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={fill} />
          <LinearGradient colors={[a(0.9), a(0), a(0), a(1)]} locations={[0, 0.1, 0.75, 1]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={fill} />
        </View>
      </View>
    );
  }

  // Téléphone : une photo en haut, fondue vers le bas
  return (
    <View pointerEvents="none" style={[fill, { overflow: "hidden" }]}>
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: width * 1.15, overflow: "hidden" }}>
        <Animated.Image
          source={require("../../assets/photos/fond-accueil.jpg")}
          resizeMode="cover"
          accessibilityLabel="Cliente aux tresses dorées dans un salon Kitoko"
          style={[fill, { width: "100%", height: "100%", transform: [{ translateY: ty }, { translateX: tx }, { scale }] }]}
        />
        <LinearGradient colors={[a(0.8), a(0.62), a(0.82), a(1)]} locations={[0, 0.4, 0.7, 1]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={fill} />
      </View>
    </View>
  );
}

// Galerie qui défile toute seule : vraies photos (lib/photos.js) ou portraits illustrés (on peut appuyer sur une coiffure)
function PortraitGallery({ t, reduce, city }) {
  const x = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(0);
  const CARD = 168;

  useEffect(() => {
    if (!w || reduce) return;
    const loop = Animated.loop(
      Animated.timing(x, { toValue: -w, duration: w * 32, easing: Easing.linear, useNativeDriver: USE_NATIVE })
    );
    loop.start();
    return () => loop.stop();
  }, [w, reduce]);

  const row = (k) => (
    <View key={k} style={{ flexDirection: "row", gap: 14, paddingRight: 14 }} onLayout={k === 0 ? (e) => setW(e.nativeEvent.layout.width) : undefined}>
      {(PHOTOS.length ? PHOTOS.map((ph, i) => ({ ...ph, id: "ph" + i, photo: true })) : PEOPLE).map((person, i) => (
        <PressScale
          key={person.id}
          onPress={() => router.push({ pathname: "/coiffeuses", params: { style: person.style, ville: city || "" } })}
          accessibilityLabel={person.label}
          style={{ width: CARD, borderRadius: R.lg, overflow: "hidden", borderWidth: 1, borderColor: t.line, backgroundColor: t.surface }}
        >
          {person.photo ? (
            <ZoomPhoto source={person.source} width={CARD} height={CARD * 1.3} reduce={reduce} delay={(i % 4) * 700} />
          ) : (
            <LinearGradient colors={person.bg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: CARD * 1.12, alignItems: "center", justifyContent: "flex-end", overflow: "hidden" }}>
              <View style={{ position: "absolute", top: -30, right: -30, width: 110, height: 110, borderRadius: 55, backgroundColor: "rgba(255,255,255,0.35)" }} />
              <Portrait person={person} size={CARD * 0.84} reduce={reduce} seed={i + k * 3} />
            </LinearGradient>
          )}
          <View style={{ padding: 12, gap: 2 }}>
            <Text numberOfLines={1} style={{ color: t.ink, fontWeight: "800", fontSize: 15 }}>{person.label}</Text>
            <Row gap={4} wrap={false}>
              <Text style={{ color: t.accent, fontWeight: "700", fontSize: 13 }}>Trouver</Text>
              <Ionicons name="arrow-forward" size={13} color={t.accent} />
            </Row>
          </View>
        </PressScale>
      ))}
    </View>
  );

  return (
    <View style={{ overflow: "hidden" }}>
      <Animated.View style={{ flexDirection: "row", paddingLeft: 20, transform: [{ translateX: x }] }}>
        {row(0)}
        {row(1)}
      </Animated.View>
    </View>
  );
}

function SectionHead({ title, kicker, onAll, t }) {
  return (
    <View style={{ paddingHorizontal: 20, marginTop: 34, marginBottom: 14, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
      <View style={{ flex: 1, gap: 4 }}>
        {kicker ? <Eyebrow>{kicker}</Eyebrow> : null}
        <Title size={24}>{title}</Title>
      </View>
      {onAll ? (
        <Pressable onPress={onAll} hitSlop={8} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={{ color: t.accent, fontWeight: "800" }}>Tout voir</Text>
          <Ionicons name="arrow-forward" size={14} color={t.accent} />
        </Pressable>
      ) : null}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Page d'accueil
// ─────────────────────────────────────────────────────────────

export default function Home() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduce = useReduceMotion();
  // Site web sur grand écran : le site a déjà son propre en-tête (app/_layout.js)
  const desktop = Platform.OS === "web" && width >= 900;
  const W = { width: "100%", maxWidth: 1240, alignSelf: "center" };
  const scrollY = useRef(new Animated.Value(0)).current;

  const [salons, setSalons] = useState([]);
  const [ratings, setRatings] = useState({});
  const [suppliers, setSuppliers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [city, setCityState] = useState("");
  const [pickCity, setPickCity] = useState(false);

  // Ville préférée gardée en mémoire sur le téléphone
  useEffect(() => {
    AsyncStorage.getItem(CITY_KEY).then((v) => { if (v) setCityState(v); }).catch(() => {});
  }, []);
  const setCity = useCallback((c) => {
    setCityState(c);
    AsyncStorage.setItem(CITY_KEY, c || "").catch(() => {});
  }, []);

  const load = useCallback(async () => {
    try {
      const [s, r, f] = await Promise.all([
        supabase.from("salons").select("id,name,city,area,styles,verified,owner_id"),
        supabase.from("salon_ratings").select("*"),
        supabase.from("suppliers").select("id,name,city,zones,delay,payments,products(id,color,price,in_stock)")
      ]);

      const errors = [
        s.error ? `Salons : ${s.error.message}` : null,
        r.error ? `Avis : ${r.error.message}` : null,
        f.error ? `Boutiques : ${f.error.message}` : null
      ].filter(Boolean);

      if (errors.length) console.error("[KITOKO] Erreurs Supabase :", { salons: s.error, avis: r.error, boutiques: f.error });
      setLoadError(errors.join(" | "));

      setSalons(s.error ? [] : (s.data ?? []));
      setSuppliers(f.error ? [] : (f.data ?? []));
      const m = {};
      (r.error ? [] : (r.data ?? [])).forEach((x) => { m[x.salon_id] = x; });
      setRatings(m);
    } catch (error) {
      console.error("[KITOKO] Erreur lors du chargement de l'accueil :", error);
      setLoadError(error?.message || "Impossible de charger les données pour le moment.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const score = (p) => {
    const r = ratings[p.id];
    return (r ? Number(r.avg_stars) * 10 + Number(r.n_reviews) : 0) + (p.verified ? 20 : 0) + (p.owner_id ? 15 : 0);
  };

  const counts = useMemo(() => {
    const c = {};
    salons.forEach((p) => { if (p.city) c[p.city] = (c[p.city] || 0) + 1; });
    return c;
  }, [salons]);

  const top = useMemo(
    () => salons
      .filter((p) => !city || p.city === city)
      .sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name))
      .slice(0, 10),
    [salons, ratings, city]
  );

  const shops = useMemo(
    () => suppliers.filter((s) => !city || s.city === city || (s.zones || []).includes(city)),
    [suppliers, city]
  );

  const nAvis = Object.values(ratings).reduce((a, r) => a + Number(r.n_reviews || 0), 0);

  // Parallaxe du haut de page
  const heroShift = scrollY.interpolate({ inputRange: [-200, 0, 400], outputRange: [-60, 0, 120], extrapolate: "clamp" });
  const heroFade = scrollY.interpolate({ inputRange: [0, 320], outputRange: [1, 0.25], extrapolate: "clamp" });
  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: USE_NATIVE });

  const skeletonCards = [0, 1, 2].map((i) => (
    <View key={i} style={{ width: 260, padding: 16, gap: 10, borderRadius: R.lg, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface }}>
      <Skeleton t={t} reduce={reduce} width={50} height={50} radius={25} />
      <Skeleton t={t} reduce={reduce} width="70%" height={16} />
      <Skeleton t={t} reduce={reduce} width="45%" height={12} />
      <Skeleton t={t} reduce={reduce} width="100%" height={34} radius={17} />
    </View>
  ));

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      {desktop ? null : <StickyBar scrollY={scrollY} t={t} insets={insets} city={city} onCity={() => setPickCity(true)} />}

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 56 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
            tintColor={t.accent}
          />
        }
      >
        {/* ───── Haut de page ───── */}
        <LinearGradient
          colors={[t.bg, t.bg]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ paddingTop: insets.top + 12, overflow: "hidden" }}
        >
          <HeroBackground t={t} scrollY={scrollY} reduce={reduce} desktop={desktop} width={width} />
          <Braid width={width} colors={[t.accent, t.gold, t.ink]} reduce={reduce} height={30} amp={6} size={6} dots={44} />

          <View style={desktop ? [W, { paddingHorizontal: 20, paddingVertical: 28 }] : null}>
          <Animated.View style={{ paddingHorizontal: desktop ? 0 : 20, paddingTop: 8, gap: 4, maxWidth: desktop ? 640 : undefined, opacity: heroFade, transform: [{ translateY: heroShift }] }}>
            {desktop ? null : <Rise delay={0} reduce={reduce}>
              <Row style={{ justifyContent: "space-between" }} wrap={false}>
                <Row wrap={false}>
                  <Image source={require("../../assets/logo.png")} accessibilityLabel="Logo Kitoko" style={{ width: 34, height: 34, borderRadius: 8 }} />
                  <Text style={{ color: t.ink, fontWeight: "800", fontSize: 22 }}>Kitoko</Text>
                </Row>
                <Pressable onPress={() => router.push("/espace")} hitSlop={8} accessibilityLabel="Mon espace"
                  style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="person-outline" size={18} color={t.ink} />
                </Pressable>
              </Row>
            </Rise>}

            <Rise delay={90} reduce={reduce}>
              <Text style={{ color: t.muted, fontSize: desktop ? 18 : 16, fontWeight: "600", marginTop: desktop ? 0 : 18 }}>
                {greeting()} 👋
              </Text>
            </Rise>

            <Rise delay={120} reduce={reduce}>
              <Row wrap={false} gap={10} style={{ marginTop: 12 }}>
                <View style={{ flexDirection: "row" }}>
                  {PHOTOS.length
                    ? PHOTOS.slice(0, 5).map((ph, i) => (
                        <Image key={i} source={ph.source} resizeMode="cover"
                          style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: t.surface, marginLeft: i ? -12 : 0, zIndex: 10 - i }} />
                      ))
                    : PEOPLE.slice(0, 5).map((person, i) => (
                        <View key={person.id} style={{ marginLeft: i ? -12 : 0, zIndex: 10 - i }}>
                          <PortraitAvatar person={person} size={40} reduce={reduce} seed={i} ring={t.surface} />
                        </View>
                      ))}
                </View>
                <Text style={{ color: t.muted, fontSize: 13, fontWeight: "600", flexShrink: 1 }}>
                  Tous les cheveux,{"\n"}toutes les coiffures
                </Text>
              </Row>
            </Rise>

            <Rise delay={140} reduce={reduce}>
              <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 9, marginTop: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: R.pill, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line }}>
                <PulseDot color={t.ok} reduce={reduce} />
                <Text style={{ color: t.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.7 }}>
                  {`DISPONIBLE DANS ${CITIES.length} VILLES DE BELGIQUE`}
                </Text>
              </View>
            </Rise>

            <Rise delay={180} reduce={reduce}>
              <Text style={{ color: t.ink, fontSize: desktop ? 60 : 44, fontWeight: "800", letterSpacing: -1.2, marginTop: 6 }}>Tes</Text>
              <RotatingWord color={t.accent} reduce={reduce} />
              <Text style={{ color: t.ink, fontSize: desktop ? 54 : 38, lineHeight: desktop ? 58 : 41, fontWeight: "800", letterSpacing: -1.2 }}>
                {city ? `par les meilleures mains de ${city}.` : "par les meilleures mains de Belgique."}
              </Text>
            </Rise>

            <Rise delay={270} reduce={reduce}>
              <Muted style={{ fontSize: desktop ? 19 : 17, lineHeight: desktop ? 28 : 24, marginTop: 12, maxWidth: 620 }}>
                Réserve ta coiffeuse, fais livrer tes mèches au salon avant ta séance, puis note ton rendez-vous.
              </Muted>
            </Rise>
          </Animated.View>

          <Rise delay={360} reduce={reduce} style={desktop ? { width: 560, marginTop: 28 } : { paddingHorizontal: 20, marginTop: 20 }}>
            <SearchCard t={t} city={city} setCity={setCity} />
          </Rise>
          </View>

          {loadError ? (
            <View style={[desktop && W, { marginHorizontal: desktop ? "auto" : 20, marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.danger }]}>
              <Text style={{ color: t.danger, fontWeight: "800" }}>Certaines informations ne se chargent pas</Text>
              <Text selectable style={{ color: t.muted, fontSize: 12, marginTop: 6 }}>{loadError}</Text>
            </View>
          ) : null}

          <View style={[desktop && W, { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 22, paddingHorizontal: 20 }]}>
            <Counter value={salons.length} label="salons et coiffeuses" w={desktop ? "23.5%" : "48%"} icon="cut-outline" t={t} reduce={reduce} />
            <Counter value={CITIES.length} label="villes disponibles" w={desktop ? "23.5%" : "48%"} icon="map-outline" t={t} reduce={reduce} />
            <Counter value={suppliers.length} label="boutiques de mèches" w={desktop ? "23.5%" : "48%"} icon="bag-handle-outline" t={t} reduce={reduce} />
            <Counter value={nAvis} label="avis de clientes" w={desktop ? "23.5%" : "48%"} icon="star-outline" t={t} reduce={reduce} />
          </View>

          <Braid width={width} colors={[t.accent, t.gold, t.ink]} reduce={reduce} />
        </LinearGradient>

        <Marquee t={t} reduce={reduce} />

        {/* ───── Galerie de portraits (toute la largeur) ───── */}
        <View style={desktop ? W : null}>
          <SectionHead t={t} kicker="Pour toutes et tous" title="Toutes les coiffures, tous les cheveux" />
        </View>
        <PortraitGallery t={t} reduce={reduce} city={city} />

        <View style={desktop ? W : null}>

        {/* ───── Villes ───── */}
        <SectionHead t={t} kicker="Près de chez toi" title="Choisis ta ville" />
        <CityStrip t={t} city={city} setCity={setCity} counts={counts} onMore={() => setPickCity(true)} reduce={reduce} />

        {/* ───── Salons ───── */}
        <SectionHead
          t={t}
          kicker={city ? `À ${city}` : "Les mieux notés"}
          title="Salons à découvrir"
          onAll={() => router.push({ pathname: "/coiffeuses", params: { ville: city || "" } })}
        />
        {!loaded ? (
          <FlatList horizontal data={skeletonCards} keyExtractor={(_, i) => "sk" + i} renderItem={({ item }) => item}
            showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }} />
        ) : top.length ? (
          <FlatList
            key={"salons-" + city}
            horizontal
            data={top}
            keyExtractor={(p) => p.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            renderItem={({ item: p, index }) => (
              <Rise delay={index * 70} reduce={reduce}>
                <SalonCard p={p} rating={ratings[p.id]} t={t} />
              </Rise>
            )}
          />
        ) : (
          <Rise reduce={reduce} style={{ marginHorizontal: 20, padding: 20, borderRadius: R.lg, borderWidth: 1, borderStyle: "dashed", borderColor: t.muted, gap: 10, alignItems: "flex-start" }}>
            <Ionicons name="location-outline" size={26} color={t.accent} />
            <Body style={{ fontWeight: "800", fontSize: 17 }}>{city ? `Pas encore de salon à ${city}` : "Les premiers salons arrivent"}</Body>
            <Muted>{city ? "Kitoko arrive bientôt dans ta ville. En attendant, découvre les salons du reste de la Belgique." : "Sois parmi les premières coiffeuses visibles sur Kitoko."}</Muted>
            <Row>
              {city ? <Btn small title="Toute la Belgique" onPress={() => setCity("")} /> : null}
              <Btn small kind={city ? "ghost" : "primary"} title={city ? `Je coiffe à ${city}` : "Inscrire mon salon"} onPress={() => router.push("/pro/salon")} />
            </Row>
          </Rise>
        )}

        {/* ───── Styles ───── */}
        <SectionHead t={t} kicker="Inspiration" title="Explorer par style" onAll={() => router.push({ pathname: "/coiffeuses", params: { ville: city || "" } })} />
        <StyleGrid t={t} width={width} city={city} reduce={reduce} />

        {/* ───── Rubriques ───── */}
        <View style={{ padding: 20, paddingTop: 30, gap: 16, flexDirection: desktop ? "row" : "column" }}>
          <Rise delay={80} reduce={reduce} style={desktop ? { flex: 1 } : null}>
            <Door
              t={t} tone={t.accent} icon="cut-outline" kicker="Rubrique" title="Celles qui tressent"
              cta={salons.length ? `${salons.length} salons et coiffeuses` : "Voir les coiffeuses"}
              text="Salons, coiffeuses à domicile ou qui reçoivent chez elles. Compare et réserve."
              onPress={() => router.push({ pathname: "/coiffeuses", params: { ville: city || "" } })}
              reduce={reduce}
            />
          </Rise>
          <Rise delay={190} reduce={reduce} style={desktop ? { flex: 1 } : null}>
            <Door
              t={t} tone={t.gold} icon="bag-handle-outline" kicker="Rubrique" title="Ceux qui vendent les mèches"
              cta={suppliers.length ? `${suppliers.length} boutiques` : "Voir les boutiques"}
              text="Commande tes mèches et fais-les livrer au salon de ton rendez-vous."
              onPress={() => router.push("/meches")}
              reduce={reduce}
            />
          </Rise>
        </View>

        {/* ───── Comment ça marche ───── */}
        <SectionHead t={t} kicker="Simple comme tout" title="Comment ça marche" />
        <Steps t={t} reduce={reduce} />

        {/* ───── Boutiques ───── */}
        <SectionHead
          t={t}
          kicker={city ? `Livraison à ${city}` : "Livraison au salon"}
          title="Boutiques de mèches"
          onAll={() => router.push("/meches")}
        />
        <FlatList
          key={"shops-" + city}
          horizontal
          data={loaded ? [...shops, { id: "cta" }] : [{ id: "sk1" }, { id: "sk2" }]}
          keyExtractor={(s) => s.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          renderItem={({ item: s, index }) => {
            if (!loaded) return skeletonCards[index];
            if (s.id === "cta") {
              return (
                <PressScale onPress={() => router.push("/pro/boutique")} accessibilityLabel="Ouvrir ma boutique"
                  style={{ width: 260, minHeight: 170, borderRadius: R.lg, borderWidth: 1, borderStyle: "dashed", borderColor: t.muted, padding: 16, gap: 8, justifyContent: "center" }}>
                  <Ionicons name="storefront-outline" size={26} color={t.gold} />
                  <Body style={{ fontWeight: "800", fontSize: 17 }}>
                    {shops.length ? "Tu vends aussi des mèches ?" : city ? `Aucune boutique ne livre encore à ${city}` : "Les premières boutiques arrivent"}
                  </Body>
                  <Muted>Ouvre ta boutique : les clientes commandent et tu livres au salon.</Muted>
                  <Text style={{ color: t.accent, fontWeight: "800" }}>Ouvrir ma boutique →</Text>
                </PressScale>
              );
            }
            return (
              <Rise delay={index * 70} reduce={reduce}>
                <SupplierCard s={s} t={t} />
              </Rise>
            );
          }}
        />

        {/* ───── Pros ───── */}
        <View style={{ padding: 20, paddingTop: 34 }}>
          <LinearGradient
            colors={t.dark ? ["#5A1838", "#2A1A27"] : [t.accent, "#4A0F2B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: R.lg, padding: 24, gap: 10, overflow: "hidden" }}
          >
            <FloatingOrb size={180} color={t.gold} top={-60} right={-50} reduce={reduce} />
            <FloatingOrb size={120} color="#ffffff" bottom={-40} left={-30} delay={900} reduce={reduce} />
            <Eyebrow style={{ color: t.goldSoft }}>Pour les pros</Eyebrow>
            <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800" }}>Tu coiffes ou tu vends des mèches ?</Text>
            <Text style={{ color: "#fff", opacity: 0.85, fontSize: 15 }}>
              Rejoins Kitoko gratuitement : les clientes te trouvent, réservent et commandent directement.
            </Text>
            <Row style={{ marginTop: 6 }}>
              <Btn kind="gold" title="J'ai un salon" onPress={() => router.push("/pro/salon")} />
              <Btn kind="ghost" title="J'ai une boutique" onPress={() => router.push("/pro/boutique")} />
            </Row>
          </LinearGradient>
        </View>
        </View>
      </Animated.ScrollView>

      {/* Choix de la ville depuis la barre du haut ou « Plus de villes » */}
      {pickCity ? (
        <CityModal t={t} value={city} onClose={() => setPickCity(false)} onPick={(c) => { setCity(c); setPickCity(false); }} counts={counts} />
      ) : null}
    </View>
  );
}

// Fenêtre de choix de ville avec recherche
function CityModal({ t, value, onClose, onPick, counts }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === "web" && width >= 900;
  const [q, setQ] = useState("");
  const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const data = ["", ...CITIES].filter((c) => !q.trim() || norm(c || "Toute la Belgique").includes(norm(q.trim())));

  return (
    <Modal visible transparent animationType={desktop ? "fade" : "slide"} onRequestClose={onClose}>
      <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(20,10,16,.5)" }} onPress={onClose} />
      {desktop ? null : <View style={{ flex: 1 }} pointerEvents="none" />}
      <View style={desktop
        ? { backgroundColor: t.surface, borderRadius: 22, width: 480, maxHeight: "80%", alignSelf: "center", marginTop: "8%", paddingBottom: 8, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 30 }
        : { backgroundColor: t.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: "75%", paddingBottom: insets.bottom + 8 }}>
        <View style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: t.line, marginTop: 10 }} />
        <Text style={{ color: t.ink, fontWeight: "800", fontSize: 20, padding: 18, paddingBottom: 10 }}>Choisis ta ville</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 18, marginBottom: 8, backgroundColor: t.bg, borderRadius: R.pill, paddingHorizontal: 14, borderWidth: 1, borderColor: t.line }}>
          <Ionicons name="search" size={16} color={t.muted} />
          <TextInput value={q} onChangeText={setQ} placeholder="Rechercher une ville…" placeholderTextColor={t.muted} autoCorrect={false}
            style={{ flex: 1, color: t.ink, fontSize: 16, paddingVertical: 10 }} />
        </View>
        <FlatList
          data={data}
          keyExtractor={(c) => c || "__all"}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Text style={{ color: t.muted, padding: 18 }}>Aucune ville trouvée</Text>}
          renderItem={({ item: c }) => (
            <Pressable onPress={() => onPick(c)}
              style={({ pressed }) => ({ paddingVertical: 14, paddingHorizontal: 18, borderTopWidth: 1, borderColor: t.line, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: pressed ? t.chip : "transparent" })}>
              <Ionicons name={c ? "location-outline" : "globe-outline"} size={18} color={t.accent} />
              <Text style={{ color: t.ink, fontSize: 16, flex: 1 }}>{c || "Toute la Belgique"}</Text>
              {c && counts[c] ? <Text style={{ color: t.muted, fontSize: 13 }}>{counts[c]} salon{counts[c] > 1 ? "s" : ""}</Text> : null}
              {value === c ? <Ionicons name="checkmark" size={18} color={t.accent} /> : null}
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}
