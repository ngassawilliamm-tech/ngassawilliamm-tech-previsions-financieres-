// Portraits illustrés et animés (tresses qui se balancent, clignement des yeux).
// Dessinés uniquement avec des View : aucune image, aucune dépendance en plus.
import { useEffect, useRef } from "react";
import { View, Animated, Easing, Platform } from "react-native";

const USE_NATIVE = Platform.OS !== "web";

// Les personnages de la galerie. `style` correspond aux styles de lib/constants.js
export const PEOPLE = [
  { id: "awa", label: "Box braids", style: "Box braids", skin: "#5A3825", hair: "#151012", lips: "#7A3B3B", cloth: "#7B1E48", bg: ["#F6D9E6", "#EBC3D6"], hairType: "box", earring: true },
  { id: "emma", label: "Tresses africaines", style: "Tresses", skin: "#F3D5C0", hair: "#D9A55B", lips: "#C9706E", cloth: "#1F6B7A", bg: ["#F7E7C6", "#EED29A"], hairType: "dutch" },
  { id: "nia", label: "Chignon tressé", style: "Cornrows / nattes collées", skin: "#8D5A3B", hair: "#1E1414", lips: "#8E4A47", cloth: "#B7790B", bg: ["#D5EEF0", "#AFDCE1"], hairType: "bun", earring: true },
  { id: "kofi", label: "Cornrows", style: "Cornrows / nattes collées", skin: "#3E2618", hair: "#0E0A0A", lips: "#5B302C", cloth: "#2E6B3F", bg: ["#E3F0DF", "#C6E2BF"], hairType: "cornrows", beard: true },
  { id: "lea", label: "Knotless", style: "Knotless", skin: "#E9BE9A", hair: "#6B3420", lips: "#B65E58", cloth: "#5B3A8C", bg: ["#E9E1F6", "#D3C4EE"], hairType: "box", earring: true },
  { id: "amara", label: "Locks", style: "Locks / dreadlocks", skin: "#6E432B", hair: "#2B1B14", lips: "#7E4440", cloth: "#9C3D1B", bg: ["#F6E0D3", "#EDC3AA"], hairType: "locks", earring: true },
  { id: "sofia", label: "Twists", style: "Twists", skin: "#C68E64", hair: "#3B2418", lips: "#9E5550", cloth: "#7B1E48", bg: ["#F3E3EC", "#E6C9D8"], hairType: "twists" },
  { id: "malik", label: "Twists homme", style: "Twists", skin: "#7A4A2E", hair: "#140E0C", lips: "#6A3632", cloth: "#22141C", bg: ["#EFE7DA", "#DFD0B6"], hairType: "shortTwists", beard: true }
];

function useLoop(reduce, duration, delay = 0) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: USE_NATIVE })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduce]);
  return v;
}

function useBlink(reduce, seed) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduce) return;
    let alive = true;
    let timer;
    const blink = () => {
      if (!alive) return;
      Animated.sequence([
        Animated.timing(v, { toValue: 0.1, duration: 70, useNativeDriver: USE_NATIVE }),
        Animated.timing(v, { toValue: 1, duration: 110, useNativeDriver: USE_NATIVE })
      ]).start(() => { timer = setTimeout(blink, 2600 + ((seed * 977) % 2400)); });
    };
    timer = setTimeout(blink, 900 + ((seed * 431) % 2000));
    return () => { alive = false; clearTimeout(timer); };
  }, [reduce]);
  return v;
}

// Une tresse qui pend et se balance depuis son point d'attache (en haut)
function Strand({ x, top, length, thick, color, sway, dir = 1, kind = "braid", cuff }) {
  const segH = kind === "lock" ? thick * 1.5 : thick * 1.25;
  const step = kind === "twist" ? segH * 0.7 : segH * 0.78;
  const n = Math.max(3, Math.floor(length / step));
  const rotate = sway.interpolate({ inputRange: [0, 1], outputRange: [`${-3 * dir}deg`, `${3 * dir}deg`] });
  const segs = [];
  for (let i = 0; i < n; i++) {
    const off = kind === "lock" ? 0 : (i % 2 ? 1 : -1) * thick * 0.14;
    const taper = kind === "braid" && i > n - 3 ? 0.7 : 1;
    segs.push(
      <View
        key={i}
        style={{
          position: "absolute",
          top: length + i * step,
          left: (thick * 1.3 - thick * taper) / 2 + off,
          width: thick * taper,
          height: segH,
          borderRadius: kind === "lock" ? thick * 0.45 : thick / 2,
          backgroundColor: cuff && i % 4 === 2 ? "#D9A441" : color,
          borderWidth: kind === "lock" ? 0 : 0.6,
          borderColor: "rgba(255,255,255,0.12)",
          transform: kind === "twist" ? [{ rotate: i % 2 ? "28deg" : "-28deg" }] : undefined
        }}
      />
    );
  }
  // Le conteneur fait 2 × la longueur : son centre (pivot de rotation) est le point d'attache
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: "absolute", left: x - (thick * 1.3) / 2, top: top - length, width: thick * 1.3, height: length * 2, transform: [{ rotate }] }}
    >
      {segs}
    </Animated.View>
  );
}

export function Portrait({ person, size = 150, reduce, seed = 0, float = true }) {
  const p = person;
  const W = size;
  const H = size * 1.2;
  const sway = useLoop(reduce, 1800 + (seed % 4) * 260, (seed % 3) * 200);
  const bob = useLoop(reduce, 2600 + (seed % 5) * 300, (seed % 4) * 300);
  const blink = useBlink(reduce, seed + 1);

  const headW = W * 0.46, headH = W * 0.56;
  const headL = (W - headW) / 2, headT = W * 0.24;
  const cx = W / 2;
  const capT = headT - W * 0.06;
  const long = ["box", "locks", "twists"].includes(p.hairType);
  const strandLen = H - capT - W * 0.12;

  // Tresses derrière la tête
  const back = [];
  if (long) {
    const thick = p.hairType === "locks" ? W * 0.07 : p.hairType === "twists" ? W * 0.055 : W * 0.045;
    const kind = p.hairType === "locks" ? "lock" : p.hairType === "twists" ? "twist" : "braid";
    const perSide = p.hairType === "locks" ? 3 : 4;
    for (let s = 0; s < 2; s++) {
      for (let k = 0; k < perSide; k++) {
        const x = s === 0 ? headL + W * 0.02 - k * thick * 0.95 : headL + headW - W * 0.02 + k * thick * 0.95;
        back.push(
          <Strand key={`${s}-${k}`} x={x} top={capT + W * 0.1 + k * W * 0.02} length={strandLen - k * W * 0.04} thick={thick}
            color={p.hair} sway={sway} dir={s === 0 ? 1 : -1} kind={kind} cuff={p.hairType === "locks" && k === 1} />
        );
      }
    }
  }

  const skinShade = "rgba(0,0,0,0.12)";
  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -W * 0.025] });

  return (
    <Animated.View style={{ width: W, height: H, transform: float && !reduce ? [{ translateY: bobY }] : undefined }}>
      {/* Chignon tressé */}
      {p.hairType === "bun" ? (
        <View style={{ position: "absolute", left: cx - W * 0.15, top: capT - W * 0.15, width: W * 0.3, height: W * 0.26, borderRadius: W * 0.15, backgroundColor: p.hair, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: W * 0.2, height: W * 0.18, borderRadius: W * 0.1, borderWidth: W * 0.018, borderColor: "rgba(255,255,255,0.13)" }} />
        </View>
      ) : null}

      {back}

      {/* Épaules et cou */}
      <View style={{ position: "absolute", left: W * 0.08, top: H - W * 0.3, width: W * 0.84, height: W * 0.42, borderTopLeftRadius: W * 0.3, borderTopRightRadius: W * 0.3, backgroundColor: p.cloth }} />
      <View style={{ position: "absolute", left: cx - W * 0.1, top: headT + headH - W * 0.08, width: W * 0.2, height: W * 0.2, borderRadius: W * 0.05, backgroundColor: p.skin }} />
      <View style={{ position: "absolute", left: cx - W * 0.1, top: headT + headH - W * 0.02, width: W * 0.2, height: W * 0.05, backgroundColor: skinShade, borderRadius: W * 0.03 }} />
      <View style={{ position: "absolute", left: cx - W * 0.13, top: H - W * 0.3, width: W * 0.26, height: W * 0.1, borderBottomLeftRadius: W * 0.13, borderBottomRightRadius: W * 0.13, backgroundColor: p.skin }} />

      {/* Oreilles et boucles d'oreilles */}
      {[headL - W * 0.035, headL + headW - W * 0.045].map((x, i) => (
        <View key={i} style={{ position: "absolute", left: x, top: headT + headH * 0.42, width: W * 0.08, height: W * 0.1, borderRadius: W * 0.04, backgroundColor: p.skin }} />
      ))}
      {p.earring ? [headL - W * 0.03, headL + headW - W * 0.035].map((x, i) => (
        <View key={i} style={{ position: "absolute", left: x, top: headT + headH * 0.6, width: W * 0.065, height: W * 0.065, borderRadius: W * 0.04, borderWidth: W * 0.012, borderColor: "#D9A441" }} />
      )) : null}

      {/* Visage */}
      <View style={{ position: "absolute", left: headL, top: headT, width: headW, height: headH, borderRadius: headW / 2, borderBottomLeftRadius: headW * 0.46, borderBottomRightRadius: headW * 0.46, backgroundColor: p.skin }} />

      {/* Barbe */}
      {p.beard ? (
        <View style={{ position: "absolute", left: headL + headW * 0.08, top: headT + headH * 0.62, width: headW * 0.84, height: headH * 0.4, borderBottomLeftRadius: headW * 0.42, borderBottomRightRadius: headW * 0.42, borderTopLeftRadius: W * 0.04, borderTopRightRadius: W * 0.04, backgroundColor: p.hair, opacity: 0.85 }} />
      ) : null}

      {/* Joues */}
      {[headL + headW * 0.12, headL + headW * 0.88 - W * 0.07].map((x, i) => (
        <View key={i} style={{ position: "absolute", left: x, top: headT + headH * 0.6, width: W * 0.07, height: W * 0.045, borderRadius: W * 0.03, backgroundColor: "rgba(232,96,120,0.22)" }} />
      ))}

      {/* Sourcils */}
      {[headL + headW * 0.2, headL + headW * 0.8 - W * 0.085].map((x, i) => (
        <View key={i} style={{ position: "absolute", left: x, top: headT + headH * 0.39, width: W * 0.085, height: W * 0.018, borderRadius: W * 0.01, backgroundColor: p.hairType === "dutch" ? "#8A6236" : "#1B1212", transform: [{ rotate: i ? "6deg" : "-6deg" }] }} />
      ))}

      {/* Yeux qui clignent */}
      {[headL + headW * 0.24, headL + headW * 0.76 - W * 0.06].map((x, i) => (
        <Animated.View key={i} style={{ position: "absolute", left: x, top: headT + headH * 0.46, width: W * 0.06, height: W * 0.045, borderRadius: W * 0.03, backgroundColor: "#1A1214", transform: [{ scaleY: blink }] }}>
          <View style={{ position: "absolute", right: W * 0.01, top: W * 0.008, width: W * 0.015, height: W * 0.015, borderRadius: W * 0.01, backgroundColor: "rgba(255,255,255,0.8)" }} />
        </Animated.View>
      ))}

      {/* Nez */}
      <View style={{ position: "absolute", left: cx - W * 0.035, top: headT + headH * 0.6, width: W * 0.07, height: W * 0.04, borderRadius: W * 0.03, backgroundColor: skinShade }} />

      {/* Bouche souriante */}
      <View style={{ position: "absolute", left: cx - W * 0.07, top: headT + headH * (p.beard ? 0.74 : 0.73), width: W * 0.14, height: W * 0.055, borderBottomLeftRadius: W * 0.07, borderBottomRightRadius: W * 0.07, borderTopLeftRadius: W * 0.015, borderTopRightRadius: W * 0.015, backgroundColor: p.lips }}>
        <View style={{ marginTop: W * 0.008, alignSelf: "center", width: W * 0.09, height: W * 0.014, borderRadius: W * 0.01, backgroundColor: "rgba(255,255,255,0.85)" }} />
      </View>

      {/* Cheveux sur le haut de la tête (avec les rangs de tresses) */}
      <Hairline p={p} W={W} headL={headL} headW={headW} capT={capT} cx={cx} />

      {/* Deux grosses nattes collées qui descendent devant les épaules */}
      {p.hairType === "dutch" ? [headL + W * 0.0, headL + headW - W * 0.0].map((x, i) => (
        <Strand key={i} x={x} top={capT + W * 0.22} length={H - capT - W * 0.32} thick={W * 0.085} color={p.hair} sway={sway} dir={i ? -1 : 1} />
      )) : null}
    </Animated.View>
  );
}

function Hairline({ p, W, headL, headW, capT, cx }) {
  const short = p.hairType === "cornrows" || p.hairType === "shortTwists";
  const capW = headW + W * 0.06;
  const capH = short ? W * 0.24 : W * 0.29;
  const rows = p.hairType === "shortTwists" ? 0 : p.hairType === "dutch" ? 2 : 5;

  return (
    <View
      style={{
        position: "absolute", left: headL - W * 0.03, top: capT, width: capW, height: capH,
        borderTopLeftRadius: capW / 2, borderTopRightRadius: capW / 2,
        borderBottomLeftRadius: W * 0.08, borderBottomRightRadius: W * 0.08,
        backgroundColor: p.hair, overflow: "hidden"
      }}
    >
      {/* Raie et rangs de tresses */}
      {Array.from({ length: rows }).map((_, i) => {
        const x = ((i + 1) * capW) / (rows + 1) - W * 0.012;
        return (
          <View key={i} style={{ position: "absolute", left: x, top: W * 0.01, width: W * 0.024, height: capH, borderRadius: W * 0.012, backgroundColor: "rgba(255,255,255,0.16)" }} />
        );
      })}
      {/* Petites twists courtes : texture en points */}
      {p.hairType === "shortTwists"
        ? Array.from({ length: 14 }).map((_, i) => (
            <View key={i} style={{ position: "absolute", left: (i % 7) * (capW / 7) + (i > 6 ? capW / 14 : 0), top: i > 6 ? W * 0.1 : W * 0.03, width: W * 0.05, height: W * 0.07, borderRadius: W * 0.025, backgroundColor: "rgba(255,255,255,0.12)" }} />
          ))
        : null}
      {/* Dégradé sur les côtés pour les hommes */}
      {short ? <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: W * 0.05, backgroundColor: "rgba(0,0,0,0.15)" }} /> : null}
    </View>
  );
}

// Petit portrait rond (pour les avatars superposés)
export function PortraitAvatar({ person, size = 44, reduce, seed = 0, ring = "#fff" }) {
  const W = size * 1.5;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: "hidden", backgroundColor: person.bg[0], borderWidth: 2, borderColor: ring }}>
      <View style={{ position: "absolute", left: (size - W) / 2 - 2, top: -W * 0.17 }}>
        <Portrait person={person} size={W} reduce={reduce} seed={seed} float={false} />
      </View>
    </View>
  );
}
