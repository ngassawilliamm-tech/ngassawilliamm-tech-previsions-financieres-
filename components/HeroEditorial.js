// Haut de l'accueil, style « magazine » : panneau taupe, grande typographie fine,
// colonne de points, grand mot en filigrane et diaporama (photos ou portraits illustrés).
import { useEffect, useRef, useState } from "react";
import { View, Text, Animated, Easing, Pressable, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Portrait, PEOPLE } from "./Portrait";
import { PHOTOS } from "../lib/photos";

const USE_NATIVE = Platform.OS !== "web";
const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "Georgia, 'Times New Roman', serif" });

function palette(dark) {
  return dark
    ? { panel: "#3A2F2B", side: "#272020", title: "#F7EEE8", ink: "#E9DCD4", soft: "#BFAEA4", btn: "#F7EEE8", btnInk: "#2A211F", ghost: "rgba(255,255,255,0.08)", gold: "#E2B04F" }
    : { panel: "#A39385", side: "#DCD6D1", title: "#FFFFFF", ink: "#2E2523", soft: "#3F3431", btn: "#2E2523", btnInk: "#FFFFFF", ghost: "rgba(255,255,255,0.22)", gold: "#B7790B" };
}

function useLoop(reduce, duration, { delay = 0, yoyo = true } = {}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const steps = [Animated.delay(delay), Animated.timing(v, { toValue: 1, duration, easing: yoyo ? Easing.inOut(Easing.sin) : Easing.linear, useNativeDriver: USE_NATIVE })];
    if (yoyo) steps.push(Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE }));
    const loop = Animated.loop(Animated.sequence(steps));
    loop.start();
    return () => loop.stop();
  }, [reduce]);
  return v;
}

function Appear({ children, delay = 0, reduce, from = 24, style }) {
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) return;
    Animated.timing(v, { toValue: 1, delay, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE }).start();
  }, [reduce]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

// Un point de la colonne : il grossit doucement, chacun avec un léger décalage
function Dot({ size, color, delay, reduce }) {
  const v = useLoop(reduce, 1600, { delay });
  return (
    <Animated.View
      style={{
        width: size, height: size, borderRadius: size / 2, backgroundColor: color,
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.08] }) }]
      }}
    />
  );
}

function Dots({ color, reduce, horizontal }) {
  const sizes = [16, 28, 42, 56];
  return (
    <View pointerEvents="none" style={{ flexDirection: horizontal ? "row" : "column", alignItems: "center", gap: horizontal ? 14 : 34 }}>
      {sizes.map((s, i) => <Dot key={s} size={horizontal ? s * 0.6 : s} color={color} delay={i * 220} reduce={reduce} />)}
    </View>
  );
}

// Motif doré en chevrons, qui scintille
function Chevrons({ color, reduce }) {
  const v = useLoop(reduce, 1400, { yoyo: false });
  return (
    <View style={{ flexDirection: "row", gap: 4, marginTop: 22 }}>
      {[0, 1, 2, 3].map((i) => (
        <Animated.View
          key={i}
          style={{
            width: 18, height: 18, borderTopWidth: 2, borderLeftWidth: 2, borderColor: color,
            transform: [{ rotate: "45deg" }, { translateX: 6 }, { translateY: 6 }],
            opacity: reduce ? 1 : v.interpolate({ inputRange: [0, (i + 0.5) / 4, 1], outputRange: [0.35, 1, 0.35], extrapolate: "clamp" })
          }}
        />
      ))}
    </View>
  );
}

// Diaporama : vraies photos si lib/photos.js en contient, sinon portraits illustrés
function Slideshow({ width, height, reduce, city }) {
  const items = PHOTOS.length ? PHOTOS : PEOPLE;
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState(null);
  const cur = useRef(0);
  const fade = useRef(new Animated.Value(1)).current;
  const zoom = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce || items.length < 2) return;
    const id = setInterval(() => {
      setPrev(cur.current);
      cur.current = (cur.current + 1) % items.length;
      setI(cur.current);
    }, 4500);
    return () => clearInterval(id);
  }, [reduce, items.length]);

  useEffect(() => {
    if (reduce) return;
    fade.setValue(0);
    zoom.setValue(0);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 1000, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE }),
      Animated.timing(zoom, { toValue: 1, duration: 5200, easing: Easing.linear, useNativeDriver: USE_NATIVE })
    ]).start();
  }, [i, reduce]);

  const layer = (idx, top) => {
    const it = items[idx];
    const scale = top ? zoom.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) : 1.07;
    const style = { position: "absolute", left: 0, top: 0, width, height, opacity: top ? fade : 1 };
    if (PHOTOS.length) {
      return (
        <Animated.View key={`p${idx}-${top}`} style={[style, { overflow: "hidden" }]}>
          <Animated.Image source={it.source} resizeMode="cover" style={{ width, height, transform: [{ scale }] }} />
        </Animated.View>
      );
    }
    const size = Math.min(width * 0.62, height * 0.68);
    return (
      <Animated.View key={`i${idx}-${top}`} style={style}>
        <LinearGradient colors={it.bg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", overflow: "hidden" }}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Portrait person={it} size={size} reduce={reduce} seed={idx} />
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const item = items[i];
  return (
    <View style={{ width, height, overflow: "hidden" }}>
      {prev !== null && prev !== i ? layer(prev, false) : null}
      {layer(i, true)}
      {/* Étiquette de la coiffure affichée */}
      <Pressable
        onPress={() => router.push({ pathname: "/coiffeuses", params: { style: item.style, ville: city || "" } })}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        style={({ pressed }) => ({
          position: "absolute", left: 18, bottom: 18, flexDirection: "row", alignItems: "center", gap: 8,
          backgroundColor: "rgba(255,255,255,0.92)", paddingHorizontal: 14, paddingVertical: 9, opacity: pressed ? 0.85 : 1
        })}
      >
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#B7790B" }} />
        <Text style={{ color: "#2E2523", fontWeight: "700", letterSpacing: 1.2, fontSize: 12, textTransform: "uppercase" }}>{item.label}</Text>
        <Ionicons name="arrow-forward" size={14} color="#2E2523" />
      </Pressable>
      {/* Indicateurs */}
      <View style={{ position: "absolute", right: 18, bottom: 26, flexDirection: "row", gap: 6 }}>
        {items.map((_, k) => (
          <View key={k} style={{ width: k === i ? 22 : 6, height: 6, borderRadius: 3, backgroundColor: k === i ? "#FFFFFF" : "rgba(255,255,255,0.55)" }} />
        ))}
      </View>
    </View>
  );
}

// Anneau doré qui tourne lentement (clin d'œil aux créoles)
function GoldRing({ size, color, reduce, style }) {
  const v = useLoop(reduce, 14000, { yoyo: false });
  return (
    <Animated.View
      pointerEvents="none"
      style={[style, {
        position: "absolute", width: size, height: size, borderRadius: size / 2,
        borderWidth: 2, borderColor: color, borderStyle: "dashed", opacity: 0.8,
        transform: [{ rotate: v.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }]
      }]}
    />
  );
}

function Btn({ title, onPress, filled, c }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        paddingVertical: 15, paddingHorizontal: 26, borderWidth: 1.5, borderColor: c.btn,
        backgroundColor: filled ? c.btn : "transparent", opacity: pressed ? 0.8 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }], alignItems: "center"
      })}
    >
      <Text style={{ color: filled ? c.btnInk : c.btn, fontWeight: "700", letterSpacing: 2, fontSize: 13, textTransform: "uppercase" }}>{title}</Text>
    </Pressable>
  );
}

export default function HeroEditorial({ t, width, desktop, insets, reduce, city, greeting, scrollY }) {
  const c = palette(t.dark);
  const drift = useLoop(reduce, 9000);
  const wordX = drift.interpolate({ inputRange: [0, 1], outputRange: [0, -60] });
  const parallax = scrollY.interpolate({ inputRange: [-200, 0, 500], outputRange: [-30, 0, 70], extrapolate: "clamp" });

  const where = city || "Belgique";

  const text = (
    <View style={{ gap: 6 }}>
      <Appear delay={60} reduce={reduce}>
        <Text style={{ color: c.soft, fontSize: 13, letterSpacing: desktop ? 3 : 2, fontWeight: "600", textTransform: "uppercase" }}>
          {desktop ? `${greeting} · Coiffure afro en ${where}` : `Coiffure afro · ${where}`}
        </Text>
      </Appear>
      <Appear delay={160} reduce={reduce}>
        <Text style={{ color: c.title, fontSize: desktop ? 112 : 68, lineHeight: desktop ? 116 : 74, fontWeight: "300", letterSpacing: desktop ? 10 : 6, marginTop: 10 }}>
          KITOKO
        </Text>
      </Appear>
      <Appear delay={260} reduce={reduce}>
        <Text style={{ color: c.ink, fontFamily: SERIF, fontSize: desktop ? 50 : 34, lineHeight: desktop ? 58 : 40 }}>
          Tresses & beauté
        </Text>
      </Appear>
      <Appear delay={360} reduce={reduce}>
        <Text style={{ color: c.soft, fontSize: desktop ? 19 : 16, lineHeight: desktop ? 30 : 25, marginTop: 14, maxWidth: 520 }}>
          Box braids, knotless, locks, cornrows… Trouve la coiffeuse qu'il te faut près de chez toi, réserve en quelques secondes et fais livrer tes mèches au salon avant ta séance.
        </Text>
      </Appear>
      <Appear delay={460} reduce={reduce} style={{ flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 26 }}>
        <Btn filled c={c} title="Réserver" onPress={() => router.push({ pathname: "/coiffeuses", params: { ville: city || "" } })} />
        <Btn c={c} title="Mes mèches" onPress={() => router.push("/meches")} />
      </Appear>
      <Appear delay={560} reduce={reduce}>
        <Chevrons color={c.gold} reduce={reduce} />
      </Appear>
    </View>
  );

  const bigWord = (
    <Animated.Text
      pointerEvents="none"
      style={{
        position: "absolute", left: -10, bottom: desktop ? -40 : -22, color: c.ghost,
        fontSize: desktop ? 190 : 110, fontWeight: "300", letterSpacing: 12, width: 2600,
        transform: [{ translateX: wordX }]
      }}
    >
      KITOKO KITOKO
    </Animated.Text>
  );

  if (desktop) {
    const H = 660;
    const panelW = Math.min(width, 1440) * 0.54;
    const visW = width - panelW;
    return (
      <View style={{ flexDirection: "row", height: H, backgroundColor: c.side, overflow: "hidden" }}>
        <View style={{ width: panelW, backgroundColor: c.panel, justifyContent: "center", paddingLeft: Math.max(40, (width - 1240) / 2 + 20), paddingRight: 70, overflow: "hidden" }}>
          {bigWord}
          {text}
        </View>
        <Animated.View style={{ width: visW, height: H, transform: [{ translateY: parallax }] }}>
          <Slideshow width={visW} height={H} reduce={reduce} city={city} />
        </Animated.View>
        <GoldRing size={220} color={c.gold} reduce={reduce} style={{ left: panelW + visW - 170, top: -60 }} />
        <View style={{ position: "absolute", left: panelW - 28, top: 0, bottom: 0, justifyContent: "center" }}>
          <Dots color={c.ink} reduce={reduce} />
        </View>
      </View>
    );
  }

  const visH = Math.round(width * 0.92);
  return (
    <View style={{ backgroundColor: c.panel }}>
      <View style={{ height: visH, overflow: "hidden", backgroundColor: c.side }}>
        <Animated.View style={{ transform: [{ translateY: parallax }] }}>
          <Slideshow width={width} height={visH} reduce={reduce} city={city} />
        </Animated.View>
        <GoldRing size={160} color={c.gold} reduce={reduce} style={{ right: -50, top: insets.top + 40 }} />
        {/* Barre du haut posée sur l'image */}
        <View style={{ position: "absolute", top: insets.top + 10, left: 20, right: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: "#FFFFFF", fontWeight: "600", letterSpacing: 4, fontSize: 16, textShadowColor: "rgba(0,0,0,0.25)", textShadowRadius: 6 }}>KITOKO</Text>
          <Pressable onPress={() => router.push("/espace")} hitSlop={8} accessibilityLabel="Mon espace"
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="person-outline" size={18} color="#2E2523" />
          </Pressable>
        </View>
      </View>
      <View style={{ paddingHorizontal: 24, paddingTop: 34, paddingBottom: 70, overflow: "hidden" }}>
        <View style={{ position: "absolute", top: -14, right: 24 }}>
          <Dots color={c.ink} reduce={reduce} horizontal />
        </View>
        {bigWord}
        {text}
      </View>
    </View>
  );
}
