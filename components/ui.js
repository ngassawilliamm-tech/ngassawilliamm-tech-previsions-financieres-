import { useState } from "react";
import { View, Text, Pressable, TextInput, Modal, FlatList, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, R } from "../lib/theme";
import { initials, colorFor, swatchColor } from "../lib/constants";

export const FONT = { display: { fontWeight: "800", letterSpacing: -0.6 }, bold: { fontWeight: "700" } };

export function Title({ children, size = 28, style }) {
  const t = useTheme();
  return <Text style={[{ color: t.ink, fontSize: size, lineHeight: size * 1.1 }, FONT.display, style]}>{children}</Text>;
}
export function Eyebrow({ children, style }) {
  const t = useTheme();
  return <Text style={[{ color: t.gold, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", fontWeight: "700" }, style]}>{children}</Text>;
}
export function Muted({ children, style, numberOfLines }) {
  const t = useTheme();
  return <Text numberOfLines={numberOfLines} style={[{ color: t.muted, fontSize: 14, lineHeight: 20 }, style]}>{children}</Text>;
}
export function Body({ children, style, numberOfLines }) {
  const t = useTheme();
  return <Text numberOfLines={numberOfLines} style={[{ color: t.ink, fontSize: 15, lineHeight: 21 }, style]}>{children}</Text>;
}
export function Label({ children }) {
  const t = useTheme();
  return <Text style={{ color: t.muted, fontSize: 12, letterSpacing: 0.8, textTransform: "uppercase", fontWeight: "700", marginBottom: 6 }}>{children}</Text>;
}

export function Btn({ title, onPress, kind = "primary", small, disabled, loading, style }) {
  const t = useTheme();
  const bg = kind === "primary" ? t.accent : kind === "gold" ? t.gold : kind === "danger" ? "transparent" : t.surface;
  const fg = kind === "primary" ? t.accentInk : kind === "gold" ? "#1A0E14" : kind === "danger" ? t.danger : t.ink;
  const border = kind === "primary" ? t.accent : kind === "gold" ? t.gold : kind === "danger" ? t.danger : t.line;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled || loading}
      style={({ pressed }) => [{ backgroundColor: bg, borderColor: border, borderWidth: 1, borderRadius: R.pill,
        paddingVertical: small ? 8 : 13, paddingHorizontal: small ? 14 : 20, alignItems: "center", justifyContent: "center",
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontWeight: "700", fontSize: small ? 14 : 16 }}>{title}</Text>}
    </Pressable>
  );
}
export function LinkBtn({ title, onPress, danger }) {
  const t = useTheme();
  return <Pressable onPress={onPress} hitSlop={8}><Text style={{ color: danger ? t.danger : t.muted, textDecorationLine: "underline", fontSize: 14 }}>{title}</Text></Pressable>;
}

export function Card({ children, style, onPress, highlight }) {
  const t = useTheme();
  const base = [{ backgroundColor: t.surface, borderColor: highlight ? t.accent : t.line, borderWidth: 1, borderRadius: R.md, padding: 16, gap: 10 }, highlight && { borderLeftWidth: 4 }, style];
  if (onPress) return <Pressable onPress={onPress} style={({ pressed }) => [...base, { opacity: pressed ? 0.9 : 1 }]}>{children}</Pressable>;
  return <View style={base}>{children}</View>;
}

export function Chip({ label, active, onPress, tone }) {
  const t = useTheme();
  const bg = active ? t.ink : tone === "ok" ? t.okSoft : tone === "gold" ? t.goldSoft : tone === "plain" ? "transparent" : t.chip;
  const fg = active ? t.bg : tone === "ok" ? t.ok : tone === "gold" ? t.gold : t.ink;
  const Comp = onPress ? Pressable : View;
  return (
    <Comp onPress={onPress} accessibilityState={onPress ? { selected: !!active } : undefined}
      style={{ backgroundColor: bg, borderRadius: onPress ? R.pill : 6, paddingVertical: onPress ? 7 : 3, paddingHorizontal: onPress ? 14 : 8,
        borderWidth: tone === "plain" || (onPress && !active) ? 1 : 0, borderColor: t.line }}>
      <Text style={{ color: fg, fontSize: onPress ? 14 : 12, fontWeight: "600" }}>{label}</Text>
    </Comp>
  );
}
export function Row({ children, style, gap = 8, wrap = true }) {
  return <View style={[{ flexDirection: "row", flexWrap: wrap ? "wrap" : "nowrap", gap, alignItems: "center" }, style]}>{children}</View>;
}

export function Avatar({ name, size = 48, seed }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colorFor(seed ?? name ?? ""), alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "#fff", fontWeight: "800", fontSize: size * 0.36 }}>{initials(name)}</Text>
    </View>
  );
}
export function Swatch({ color, size = 24 }) {
  const t = useTheme(); const c = swatchColor(color);
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c ?? t.chip, borderWidth: 2, borderColor: t.line }} />;
}

export function Stars({ value = 0, size = 15 }) {
  const t = useTheme(); const r = Math.round(value);
  return <Text style={{ fontSize: size, letterSpacing: 1 }}>{[1, 2, 3, 4, 5].map((i) => <Text key={i} style={{ color: i <= r ? t.gold : t.line }}>★</Text>)}</Text>;
}
export function Rating({ rating }) {
  const t = useTheme();
  if (!rating || !rating.n_reviews) return <Muted>Pas encore d'avis</Muted>;
  return (
    <Row>
      <Stars value={Number(rating.avg_stars)} />
      <Text style={{ color: t.ink, fontWeight: "800" }}>{String(rating.avg_stars).replace(".", ",")}</Text>
      <Muted>{rating.n_reviews} avis</Muted>
      <Chip label={`${rating.pct_satisfied} % satisfaits`} tone={rating.pct_satisfied >= 50 ? "ok" : undefined} />
    </Row>
  );
}

export function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, maxLength, autoCapitalize, secureTextEntry }) {
  const t = useTheme();
  return (
    <View style={{ gap: 2 }}>
      {label ? <Label>{label}</Label> : null}
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={t.muted}
        multiline={multiline} keyboardType={keyboardType} maxLength={maxLength} autoCapitalize={autoCapitalize} secureTextEntry={secureTextEntry}
        style={{ backgroundColor: t.surface, color: t.ink, borderColor: t.line, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12,
          paddingVertical: 11, fontSize: 16, minHeight: multiline ? 84 : undefined, textAlignVertical: multiline ? "top" : "center" }} />
    </View>
  );
}

// Liste de choix dans une fenêtre (aucune dépendance externe)
export function Select({ label, value, options, onChange, placeholder = "Choisir…" }) {
  const t = useTheme(); const [open, setOpen] = useState(false);
  const opts = options.map((o) => (typeof o === "string" ? { label: o, value: o } : o));
  const current = opts.find((o) => o.value === value);
  return (
    <View style={{ gap: 2 }}>
      {label ? <Label>{label}</Label> : null}
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button"
        style={{ backgroundColor: t.surface, borderColor: t.line, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: current ? t.ink : t.muted, fontSize: 16, flex: 1 }} numberOfLines={1}>{current ? current.label : placeholder}</Text>
        <Text style={{ color: t.muted }}>▾</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(20,10,16,.5)" }} onPress={() => setOpen(false)} />
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: t.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%" }}>
          <Text style={{ color: t.ink, fontWeight: "800", fontSize: 18, padding: 18 }}>{label || placeholder}</Text>
          <FlatList data={opts} keyExtractor={(o) => String(o.value)}
            renderItem={({ item }) => (
              <Pressable onPress={() => { onChange(item.value); setOpen(false); }}
                style={{ paddingVertical: 14, paddingHorizontal: 18, borderTopWidth: 1, borderColor: t.line, flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ color: t.ink, fontSize: 16, flex: 1 }}>{item.label}</Text>
                {item.value === value ? <Text style={{ color: t.accent, fontWeight: "800" }}>✓</Text> : null}
              </Pressable>
            )} />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

export function MultiChips({ options, values, onChange }) {
  return (
    <Row>
      {options.map((o) => {
        const on = values.includes(o);
        return <Chip key={o} label={o} active={on} onPress={() => onChange(on ? values.filter((v) => v !== o) : [...values, o])} />;
      })}
    </Row>
  );
}

export function StatusPill({ label, tone }) {
  return <Chip label={label} tone={tone} />;
}

export function Empty({ title, text, action }) {
  const t = useTheme();
  return (
    <View style={{ borderWidth: 1.5, borderStyle: "dashed", borderColor: t.line, borderRadius: R.md, padding: 24, alignItems: "center", gap: 8 }}>
      <Text style={{ color: t.ink, fontSize: 18, fontWeight: "800", textAlign: "center" }}>{title}</Text>
      {text ? <Muted style={{ textAlign: "center" }}>{text}</Muted> : null}
      {action}
    </View>
  );
}
export function ErrorText({ children }) {
  const t = useTheme();
  if (!children) return null;
  return <Text style={{ color: t.danger, fontSize: 14 }}>{children}</Text>;
}
export function Loading() {
  const t = useTheme();
  return <View style={{ padding: 32, alignItems: "center" }}><ActivityIndicator color={t.accent} /></View>;
}

export function Screen({ children, scroll = true, refreshControl, contentStyle }) {
  const t = useTheme();
  if (!scroll) return <View style={{ flex: 1, backgroundColor: t.bg }}>{children}</View>;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={[{ padding: 16, gap: 14, paddingBottom: 48 }, contentStyle]}
      refreshControl={refreshControl} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

export const s = StyleSheet.create({ grow: { flex: 1, minWidth: 0 } });
