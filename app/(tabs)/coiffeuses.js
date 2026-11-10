import { useCallback, useMemo, useState } from "react";
import { View, FlatList, TextInput, RefreshControl } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../lib/theme";
import { CITIES, STYLES, MODE_LABEL } from "../../lib/constants";
import { Card, Row, Avatar, Body, Muted, Chip, Rating, Select, Empty, Loading, Btn } from "../../components/ui";

export default function Coiffeuses() {
  const t = useTheme();
  const [salons, setSalons] = useState(null); const [ratings, setRatings] = useState({});
  const [q, setQ] = useState(""); const [city, setCity] = useState(""); const [style, setStyle] = useState(""); const [mode, setMode] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [s, r] = await Promise.all([supabase.from("salons").select("*").order("name"), supabase.from("salon_ratings").select("*")]);
    setSalons(s.data ?? []); const m = {}; (r.data ?? []).forEach((x) => (m[x.salon_id] = x)); setRatings(m);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return (salons ?? []).filter((p) => (!city || p.city === city) && (!style || (p.styles || []).includes(style)) && (!mode || p.mode === mode)
      && (!k || [p.name, p.area, p.city, (p.styles || []).join(" "), p.bio].join(" ").toLowerCase().includes(k)))
      .sort((a, b) => (b.verified - a.verified) || ((ratings[b.id]?.avg_stars ?? 0) - (ratings[a.id]?.avg_stars ?? 0)) || a.name.localeCompare(b.name));
  }, [salons, ratings, q, city, style, mode]);

  const header = (
    <View style={{ gap: 10, marginBottom: 6 }}>
      <TextInput value={q} onChangeText={setQ} placeholder="Nom, quartier, knotless…" placeholderTextColor={t.muted}
        style={{ backgroundColor: t.surface, color: t.ink, borderColor: t.line, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11, fontSize: 16 }} />
      <Row wrap={false} gap={10}>
        <View style={{ flex: 1 }}><Select value={city} onChange={setCity} placeholder="Toute la Belgique" options={[{ label: "Toute la Belgique", value: "" }, ...CITIES]} /></View>
        <View style={{ flex: 1 }}><Select value={style} onChange={setStyle} placeholder="Tous les styles" options={[{ label: "Tous les styles", value: "" }, ...STYLES]} /></View>
      </Row>
      <Row>
        {[["", "Toutes"], ...Object.entries(MODE_LABEL)].map(([v, l]) => <Chip key={v || "all"} label={l} active={mode === v} onPress={() => setMode(v)} />)}
      </Row>
      {salons ? <Muted>{list.length} résultat{list.length > 1 ? "s" : ""}</Muted> : null}
    </View>
  );

  return (
    <FlatList style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40, width: "100%", maxWidth: 1040, alignSelf: "center" }}
      data={list} keyExtractor={(p) => p.id} ListHeaderComponent={header}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={t.accent} />}
      ListEmptyComponent={salons === null ? <Loading /> : <Empty title="Aucune coiffeuse ne correspond" text="Essaie une autre ville ou un autre style." />}
      renderItem={({ item: p }) => (
        <Card onPress={() => router.push(`/salon/${p.id}`)}>
          <Row wrap={false} gap={12}>
            <Avatar name={p.name} />
            <View style={{ flex: 1, gap: 2 }}>
              <Body style={{ fontWeight: "800", fontSize: 17 }}>{p.name}</Body>
              <Muted>{[p.area, p.city].filter(Boolean).join(" · ")}</Muted>
              <Row style={{ marginTop: 4 }}>
                <Chip label={MODE_LABEL[p.mode] || "En salon"} tone="gold" />
                {p.verified ? <Chip label="Vérifiée" tone="ok" /> : null}
                {p.owner_id ? <Chip label="Réservation dans l'app" tone="ok" /> : null}
              </Row>
            </View>
          </Row>
          <Rating rating={ratings[p.id]} />
          <Row>{(p.styles || []).slice(0, 4).map((x) => <Chip key={x} label={x} tone="plain" />)}</Row>
          <Row style={{ justifyContent: "space-between" }}>
            <Muted>{p.price_from ? `dès ${p.price_from} €` : "Prix sur demande"}</Muted>
            <Btn small title="Réserver" onPress={() => router.push(`/reserver/${p.id}`)} />
          </Row>
        </Card>
      )} />
  );
}
