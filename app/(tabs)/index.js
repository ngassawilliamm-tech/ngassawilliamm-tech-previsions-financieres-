import { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, Animated, Easing, Pressable, FlatList, ScrollView, useWindowDimensions, AccessibilityInfo, RefreshControl } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useTheme, R } from "../../lib/theme";
import { Btn, Title, Muted, Eyebrow, Card, Avatar, Rating, Row, Chip, Swatch, Body } from "../../components/ui";
import { euro } from "../../lib/constants";

const WORDS = ["knotless", "box braids", "locks", "twists", "cornrows", "faux locs", "tissages", "French curls"];
const MARQUEE = ["Box braids", "Knotless", "Cornrows", "Twists", "Locks", "Faux locs", "French curl", "Crochet braids", "Tissage", "Lace wig", "Soins 4C", "Coiffure enfants", "Mariage"];

function useReduceMotion() {
  const [r, setR] = useState(false);
  useEffect(() => { AccessibilityInfo.isReduceMotionEnabled().then(setR); const s = AccessibilityInfo.addEventListener("reduceMotionChanged", setR); return () => s.remove(); }, []);
  return r;
}

// Tresse animée : trois mèches de points qui ondulent et se croisent
function Braid({ width, colors, reduce, height = 56, amp = 14, dots = 30, size = 12 }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration: 3200, easing: Easing.linear, useNativeDriver: true }));
    loop.start(); return () => loop.stop();
  }, [reduce]);
  const step = width / dots;
  const items = [];
  for (let s = 0; s < 3; s++) {
    for (let i = 0; i <= dots; i++) {
      const phase = i * 0.42 + (s * 2 * Math.PI) / 3;
      const ys = [0, 0.25, 0.5, 0.75, 1].map((k) => amp * Math.sin(phase + k * 2 * Math.PI));
      const zs = [0, 0.25, 0.5, 0.75, 1].map((k) => 0.8 + 0.25 * Math.cos(phase + k * 2 * Math.PI));
      items.push(
        <Animated.View key={`${s}-${i}`} style={{
          position: "absolute", left: i * step - size / 2, top: height / 2 - size / 2, width: size, height: size, borderRadius: size / 2,
          backgroundColor: colors[s], opacity: 0.9,
          transform: reduce ? [{ translateY: ys[0] }] : [
            { translateY: t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ys }) },
            { scale: t.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: zs }) },
          ],
        }} />
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
      if (reduce) { setI((x) => (x + 1) % WORDS.length); return; }
      Animated.timing(y, { toValue: -1, duration: 260, useNativeDriver: true, easing: Easing.in(Easing.quad) }).start(() => {
        setI((x) => (x + 1) % WORDS.length); y.setValue(1);
        Animated.timing(y, { toValue: 0, duration: 380, useNativeDriver: true, easing: Easing.out(Easing.cubic) }).start();
      });
    }, 2400);
    return () => clearInterval(id);
  }, [reduce]);
  return (
    <View style={{ overflow: "hidden", height: 50 }}>
      <Animated.Text style={{ color, fontSize: 44, fontWeight: "800", fontStyle: "italic", letterSpacing: -1.2, transform: [{ translateY: y.interpolate({ inputRange: [-1, 1], outputRange: [-50, 50] }) }] }}>
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
    const loop = Animated.loop(Animated.timing(x, { toValue: -w, duration: w * 28, easing: Easing.linear, useNativeDriver: true }));
    loop.start(); return () => loop.stop();
  }, [w, reduce]);
  const row = (k) => (
    <View key={k} style={{ flexDirection: "row" }} onLayout={k === 0 ? (e) => setW(e.nativeEvent.layout.width) : undefined}>
      {MARQUEE.map((m) => <Text key={m} style={{ color: t.bg, fontWeight: "800", fontSize: 17, marginRight: 22 }}>{m}  <Text style={{ color: t.gold }}>✦</Text></Text>)}
    </View>
  );
  return (
    <View style={{ backgroundColor: t.ink, paddingVertical: 12, overflow: "hidden" }}>
      <Animated.View style={{ flexDirection: "row", transform: [{ translateX: x }] }}>{row(0)}{row(1)}</Animated.View>
    </View>
  );
}

function Counter({ value, label, t, reduce }) {
  const a = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (reduce) { setShown(value); return; }
    const id = a.addListener(({ value: v }) => setShown(Math.round(v)));
    Animated.timing(a, { toValue: value, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => a.removeListener(id);
  }, [value, reduce]);
  return (
    <View style={{ borderLeftWidth: 2, borderLeftColor: t.gold, paddingLeft: 10, width: "47%", marginBottom: 12 }}>
      <Text style={{ color: t.ink, fontSize: 32, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{shown}</Text>
      <Text style={{ color: t.muted, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

function Rise({ children, delay, reduce }) {
  const v = useRef(new Animated.Value(reduce ? 0 : 1)).current;
  useEffect(() => { if (!reduce) Animated.timing(v, { toValue: 0, delay, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, []);
  return <Animated.View style={{ transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, 18] }) }] }}>{children}</Animated.View>;
}

function Door({ kicker, title, text, cta, onPress, t, tone }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable onPress={onPress} onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}>
      <Animated.View style={{ transform: [{ scale }], backgroundColor: t.surface, borderColor: t.line, borderWidth: 1, borderRadius: R.lg, padding: 22, gap: 8, overflow: "hidden", minHeight: 190 }}>
        <View style={{ position: "absolute", right: -36, bottom: -36, width: 150, height: 150, borderRadius: 75, borderWidth: 18, borderColor: tone, opacity: 0.85 }} />
        <Eyebrow>{kicker}</Eyebrow>
        <Title size={28} style={{ maxWidth: "80%" }}>{title}</Title>
        <Muted style={{ maxWidth: "78%" }}>{text}</Muted>
        <Text style={{ color: t.accent, fontWeight: "800", marginTop: 6 }}>{cta} →</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function Home() {
  const t = useTheme(); const insets = useSafeAreaInsets(); const { width } = useWindowDimensions(); const reduce = useReduceMotion();
  const [salons, setSalons] = useState([]); const [ratings, setRatings] = useState({}); const [suppliers, setSuppliers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [s, r, f] = await Promise.all([
      supabase.from("salons").select("id,name,city,area,styles,verified,owner_id"),
      supabase.from("salon_ratings").select("*"),
      supabase.from("suppliers").select("id,name,city,zones,delay,payments,products(id,color,price,in_stock)"),
    ]);
    setSalons(s.data ?? []); setSuppliers(f.data ?? []);
    const m = {}; (r.data ?? []).forEach((x) => (m[x.salon_id] = x)); setRatings(m);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const score = (p) => { const r = ratings[p.id]; return (r ? Number(r.avg_stars) * 10 + r.n_reviews : 0) + (p.verified ? 20 : 0) + (p.owner_id ? 15 : 0); };
  const top = [...salons].sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name)).slice(0, 10);
  const nAvis = Object.values(ratings).reduce((a, r) => a + Number(r.n_reviews), 0);
  const cities = new Set(salons.map((p) => p.city)).size;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={t.accent} />}>
      <LinearGradient colors={t.dark ? ["#2A1A27", t.bg] : [t.goldSoft, t.bg]} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={{ paddingTop: insets.top + 12 }}>
        <Braid width={width} colors={[t.accent, t.gold, t.ink]} reduce={reduce} height={30} amp={6} size={6} dots={44} />
        <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 4 }}>
          <Rise delay={0} reduce={reduce}><Row><View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: t.accent }} /><Text style={{ color: t.ink, fontWeight: "800", fontSize: 22 }}>Kitoko</Text></Row></Rise>
          <Rise delay={90} reduce={reduce}><Eyebrow style={{ marginTop: 18 }}>Coiffure afro · partout en Belgique</Eyebrow></Rise>
          <Rise delay={180} reduce={reduce}>
            <Text style={{ color: t.ink, fontSize: 44, fontWeight: "800", letterSpacing: -1.2, marginTop: 6 }}>Tes</Text>
            <RotatingWord color={t.accent} reduce={reduce} />
            <Text style={{ color: t.ink, fontSize: 40, lineHeight: 42, fontWeight: "800", letterSpacing: -1.2 }}>par les meilleures mains de Belgique.</Text>
          </Rise>
          <Rise delay={270} reduce={reduce}><Muted style={{ fontSize: 17, lineHeight: 24, marginTop: 12 }}>Réserve ta coiffeuse, fais livrer tes mèches au salon avant ta séance, puis note ton rendez-vous.</Muted></Rise>
          <Rise delay={360} reduce={reduce}>
            <View style={{ gap: 10, marginTop: 20 }}>
              <Btn title="Trouver une coiffeuse" onPress={() => router.push("/coiffeuses")} />
              <Btn title="Acheter des mèches" kind="ghost" onPress={() => router.push("/meches")} />
            </View>
          </Rise>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 26 }}>
            <Counter value={salons.length} label="salons et coiffeuses" t={t} reduce={reduce} />
            <Counter value={cities} label="villes couvertes" t={t} reduce={reduce} />
            <Counter value={suppliers.length} label="boutiques de mèches" t={t} reduce={reduce} />
            <Counter value={nAvis} label="avis de clientes" t={t} reduce={reduce} />
          </View>
        </View>
        <Braid width={width} colors={[t.accent, t.gold, t.ink]} reduce={reduce} />
      </LinearGradient>
      <Marquee t={t} reduce={reduce} />

      <View style={{ padding: 20, gap: 16 }}>
        <Door t={t} tone={t.accent} kicker="Rubrique" title="Celles qui tressent" cta={salons.length ? `${salons.length} salons et coiffeuses` : "Voir les coiffeuses"}
          text="Salons, coiffeuses à domicile ou qui reçoivent chez elles. Compare et réserve." onPress={() => router.push("/coiffeuses")} />
        <Door t={t} tone={t.gold} kicker="Rubrique" title="Ceux qui vendent les mèches" cta={suppliers.length ? `${suppliers.length} boutiques` : "Voir les boutiques"}
          text="Commande tes mèches et fais-les livrer au salon de ton rendez-vous." onPress={() => router.push("/meches")} />

        <Title size={24} style={{ marginTop: 10 }}>Comment ça marche</Title>
        {[["Réserve", "Choisis ta coiffeuse, ta coiffure, ta date. Elle valide dans son espace."], ["Fais livrer tes mèches", "Le fournisseur livre au salon, avant ta séance."], ["Note ta séance", "Étoiles, satisfaite ou pas : tu aides les autres clientes."]].map(([a, b], i) => (
          <Card key={a} style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: t.accent, alignItems: "center", justifyContent: "center" }}><Text style={{ color: t.accentInk, fontWeight: "800" }}>{i + 1}</Text></View>
            <View style={{ flex: 1, gap: 2 }}><Body style={{ fontWeight: "800", fontSize: 17 }}>{a}</Body><Muted>{b}</Muted></View>
          </Card>
        ))}

        <Row style={{ justifyContent: "space-between", marginTop: 10 }}><Title size={24}>Salons à découvrir</Title><Text onPress={() => router.push("/coiffeuses")} style={{ color: t.muted, textDecorationLine: "underline" }}>Tout voir</Text></Row>
      </View>
      <FlatList horizontal data={top} keyExtractor={(p) => p.id} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        renderItem={({ item: p }) => (
          <Card onPress={() => router.push(`/salon/${p.id}`)} style={{ width: 250 }}>
            <Row wrap={false}><Avatar name={p.name} size={42} /><View style={{ flex: 1 }}><Body numberOfLines={1} style={{ fontWeight: "800" }}>{p.name}</Body><Muted numberOfLines={1}>{[p.area, p.city].filter(Boolean).join(" · ")}</Muted></View></Row>
            <Rating rating={ratings[p.id]} />
            <Row>{(p.styles || []).slice(0, 2).map((x) => <Chip key={x} label={x} tone="plain" />)}</Row>
            <Btn small title="Réserver" onPress={() => router.push(`/reserver/${p.id}`)} />
          </Card>
        )} />

      <View style={{ padding: 20, gap: 16 }}>
        <Row style={{ justifyContent: "space-between", marginTop: 6 }}><Title size={24}>Boutiques de mèches</Title><Text onPress={() => router.push("/meches")} style={{ color: t.muted, textDecorationLine: "underline" }}>Tout voir</Text></Row>
      </View>
      <FlatList horizontal data={[...suppliers, { id: "cta" }]} keyExtractor={(s) => s.id} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        renderItem={({ item: s }) => s.id === "cta" ? (
          <Card style={{ width: 250, borderStyle: "dashed", backgroundColor: "transparent", justifyContent: "center" }}>
            <Body style={{ fontWeight: "800", fontSize: 17 }}>{suppliers.length ? "Tu vends aussi des mèches ?" : "Les premières boutiques arrivent"}</Body>
            <Muted>Ouvre ta boutique : les clientes commandent et tu livres au salon.</Muted>
            <Btn small title="Ouvrir ma boutique" onPress={() => router.push("/pro/boutique")} />
          </Card>
        ) : (
          <Card onPress={() => router.push({ pathname: "/meches", params: { fournisseur: s.id } })} style={{ width: 250 }}>
            <Row wrap={false}><Avatar name={s.name} seed={"m" + s.name} size={42} /><View style={{ flex: 1 }}><Body numberOfLines={1} style={{ fontWeight: "800" }}>{s.name}</Body><Muted>{s.city} · {s.zones?.length ?? 0} villes</Muted></View></Row>
            <Row>{[...new Set((s.products || []).filter((p) => p.in_stock).map((p) => p.color))].slice(0, 6).map((c) => <Swatch key={c} color={c} />)}</Row>
            <Muted>{(s.products || []).filter((p) => p.in_stock).length} produits{(s.products || []).length ? ` · dès ${euro(Math.min(...s.products.map((p) => p.price)))}` : ""} · {s.delay}</Muted>
          </Card>
        )} />

      <View style={{ padding: 20 }}>
        <View style={{ backgroundColor: t.ink, borderRadius: R.lg, padding: 24, gap: 10 }}>
          <Text style={{ color: t.bg, fontSize: 24, fontWeight: "800" }}>Tu coiffes ou tu vends des mèches ?</Text>
          <Text style={{ color: t.bg, opacity: 0.8, fontSize: 15 }}>Rejoins Kitoko gratuitement : les clientes te trouvent, réservent et commandent directement.</Text>
          <Btn kind="gold" title="Rejoindre Kitoko" onPress={() => router.push("/espace")} />
        </View>
      </View>
    </ScrollView>
  );
}
