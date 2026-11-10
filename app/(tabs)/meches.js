import { useCallback, useMemo, useState } from "react";
import { View, FlatList, Pressable, Text, RefreshControl } from "react-native";
import { router, useFocusEffect, useLocalSearchParams, Stack } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../lib/theme";
import { useCart } from "../../lib/cart";
import { CITIES, MECHE_TYPES, MECHE_COLORS, euro } from "../../lib/constants";
import { Card, Row, Avatar, Body, Muted, Chip, Select, Empty, Loading, Btn, Swatch, Title, LinkBtn } from "../../components/ui";

const SHORT = { "Espèces à la livraison": "Espèces", "Bancontact (carte) à la livraison": "Bancontact", "Payconiq à la livraison": "Payconiq", "Virement bancaire avant livraison": "Virement", "Payconiq avant livraison": "Payconiq (avant)" };

function Qty({ value, onChange, t }) {
  const b = (label, d) => (
    <Pressable onPress={() => onChange(Math.max(1, Math.min(30, value + d)))} hitSlop={6}
      style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: t.line, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: t.ink, fontSize: 18, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
  return <Row gap={10} wrap={false}>{b("−", -1)}<Text style={{ color: t.ink, fontWeight: "800", fontSize: 16, minWidth: 22, textAlign: "center" }}>{value}</Text>{b("+", 1)}</Row>;
}

export default function Meches() {
  const t = useTheme(); const cart = useCart(); const params = useLocalSearchParams();
  const [suppliers, setSuppliers] = useState(null);
  const [type, setType] = useState(""); const [color, setColor] = useState(""); const [city, setCity] = useState("");
  const [sup, setSup] = useState(params.fournisseur ?? ""); const [qty, setQty] = useState({}); const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("suppliers").select("*, products(*)").order("name");
    setSuppliers(data ?? []);
  }, []);
  useFocusEffect(useCallback(() => { load(); if (params.fournisseur) setSup(params.fournisseur); }, [load, params.fournisseur]));

  const products = useMemo(() => {
    const out = [];
    (suppliers ?? []).forEach((s) => (s.products || []).forEach((p) => { if (p.in_stock) out.push({ s, p }); }));
    return out.filter(({ s, p }) => (!sup || s.id === sup) && (!type || p.type === type) && (!color || p.color === color) && (!city || (s.zones || []).includes(city)))
      .sort((a, b) => a.p.price - b.p.price);
  }, [suppliers, type, color, city, sup]);
  const supName = sup && (suppliers ?? []).find((s) => s.id === sup)?.name;

  const header = (
    <View style={{ gap: 12, marginBottom: 6 }}>
      <Title size={22}>Les vendeurs de mèches</Title>
      <FlatList horizontal data={suppliers ?? []} keyExtractor={(s) => s.id} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}
        ListEmptyComponent={suppliers ? <Card style={{ width: 260, borderStyle: "dashed" }}><Body style={{ fontWeight: "800" }}>Aucune boutique pour l'instant</Body><Muted>Les vendeurs inscrits apparaîtront ici.</Muted><Btn small title="Je vends des mèches" onPress={() => router.push("/pro/boutique")} /></Card> : null}
        renderItem={({ item: s }) => (
          <Card onPress={() => setSup(sup === s.id ? "" : s.id)} highlight={sup === s.id} style={{ width: 240 }}>
            <Row wrap={false}><Avatar name={s.name} seed={"m" + s.name} size={40} /><View style={{ flex: 1 }}><Body numberOfLines={1} style={{ fontWeight: "800" }}>{s.name}</Body><Muted>{s.city} · {s.delay}</Muted></View></Row>
            <Muted numberOfLines={2}>Livre à : {(s.zones || []).join(", ")}</Muted>
            <Muted>Paiement : {(s.payments || []).map((x) => SHORT[x] || x).join(", ")}</Muted>
          </Card>
        )} />
      <Title size={22} style={{ marginTop: 6 }}>Toutes les mèches</Title>
      {supName ? <Row><Chip label={`Vendeur : ${supName}`} tone="gold" /><LinkBtn title="Voir tous les vendeurs" onPress={() => setSup("")} /></Row> : null}
      <Row wrap={false} gap={10}>
        <View style={{ flex: 1 }}><Select value={type} onChange={setType} placeholder="Tous les types" options={[{ label: "Tous les types", value: "" }, ...MECHE_TYPES]} /></View>
        <View style={{ flex: 1 }}><Select value={color} onChange={setColor} placeholder="Toutes couleurs" options={[{ label: "Toutes les couleurs", value: "" }, ...MECHE_COLORS]} /></View>
      </Row>
      <Select value={city} onChange={setCity} placeholder="Livraison : toutes les villes" options={[{ label: "Livraison : toutes les villes", value: "" }, ...CITIES.map((c) => ({ label: "Livré à " + c, value: c }))]} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <Stack.Screen options={{ headerRight: () => cart.count ? <Pressable onPress={() => router.push("/panier")} style={{ marginRight: 16 }}><Text style={{ color: t.accent, fontWeight: "800" }}>Panier · {cart.count}</Text></Pressable> : null }} />
      <FlatList contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: cart.count ? 110 : 40, width: "100%", maxWidth: 1120, alignSelf: "center" }}
        data={products} keyExtractor={({ p }) => p.id} ListHeaderComponent={header}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={t.accent} />}
        ListEmptyComponent={suppliers === null ? <Loading /> : <Empty title={suppliers.length ? "Aucune mèche ne correspond" : "Le catalogue arrive bientôt"} text={suppliers.length ? "Essaie un autre type, une autre couleur ou une autre ville." : "Dès qu'un fournisseur ajoute ses mèches, elles apparaissent ici."} />}
        renderItem={({ item: { s, p } }) => {
          const q = qty[p.id] ?? 3;
          return (
            <Card>
              <Row wrap={false} gap={12}>
                <Swatch color={p.color} size={34} />
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: "800", fontSize: 17 }}>{p.name || p.type}</Body>
                  <Muted>{p.type} · {p.color}{p.length ? ` · ${p.length} pouces` : ""}</Muted>
                </View>
              </Row>
              <Row style={{ justifyContent: "space-between" }}>
                <Text style={{ color: t.ink }}><Text style={{ fontWeight: "800", fontSize: 18 }}>{euro(p.price)}</Text> / paquet</Text>
                <Muted>{s.name} · {s.city}</Muted>
              </Row>
              <Muted>Livraison {Number(s.fee) ? euro(s.fee) : "offerte"} · {s.delay}</Muted>
              <Row style={{ justifyContent: "space-between" }}>
                <Qty value={q} onChange={(v) => setQty({ ...qty, [p.id]: v })} t={t} />
                <Btn small title="Ajouter au panier" onPress={() => cart.add(p, s, q)} />
              </Row>
            </Card>
          );
        }} />
      {cart.count ? (
        <View style={{ position: "absolute", left: 16, right: 16, bottom: 16 }}>
          <Btn title={`Voir mon panier · ${cart.count} paquet${cart.count > 1 ? "s" : ""}`} onPress={() => router.push("/panier")} />
        </View>
      ) : null}
    </View>
  );
}
