import { useCallback, useEffect, useState } from "react";
import { Switch, View } from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { useTheme } from "../../lib/theme";
import { CITIES, MECHE_TYPES, MECHE_COLORS, PAY_METHODS, DELAYS, euro } from "../../lib/constants";
import { Screen, Title, Muted, Label, Field, Select, MultiChips, Btn, ErrorText, Row, Body, Card, Swatch, LinkBtn } from "../../components/ui";

export default function Boutique() {
  const t = useTheme(); const { user, mySupplier, refreshRoles } = useAuth();
  const [f, setF] = useState({ name: "", city: "Bruxelles", zones: ["Bruxelles"], fee: "", delay: "24 h", payments: ["Espèces à la livraison", "Payconiq à la livraison"], iban: "", phone: "", whatsapp: true });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [products, setProducts] = useState([]);
  const [p, setP] = useState({ type: MECHE_TYPES[0], name: "", color: MECHE_COLORS[1], length: "", price: "" }); const [pErr, setPErr] = useState("");
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  const loadProducts = useCallback(async () => {
    if (!mySupplier) return;
    const { data } = await supabase.from("products").select("*").eq("supplier_id", mySupplier.id).order("created_at");
    setProducts(data ?? []);
  }, [mySupplier?.id]);
  useEffect(() => {
    if (mySupplier) setF({ ...mySupplier, fee: mySupplier.fee ? String(mySupplier.fee) : "", iban: mySupplier.iban ?? "", phone: mySupplier.phone ?? "" });
    loadProducts();
  }, [mySupplier?.id]);

  if (!user) return <Screen><Title size={24}>Connecte-toi d'abord</Title><Btn title="Me connecter" onPress={() => router.push("/connexion")} /></Screen>;

  async function saveShop() {
    setErr("");
    if (f.name.trim().length < 2) return setErr("Indique le nom de ta boutique.");
    if (!f.zones.length) return setErr("Choisis au moins une ville où tu livres.");
    if (!f.payments.length) return setErr("Choisis au moins un mode de paiement.");
    if (f.phone.replace(/[^\d]/g, "").length < 9) return setErr("Indique un numéro de téléphone complet.");
    const iban = f.iban.replace(/\s+/g, " ").trim().toUpperCase();
    if (iban && !/^[A-Z]{2}\d{2}[A-Z0-9 ]{10,30}$/.test(iban)) return setErr("L'IBAN n'est pas valide (ex. BE68 5390 0754 7034).");
    const row = { name: f.name.trim(), city: f.city, zones: f.zones, fee: Number(String(f.fee).replace(",", ".")) || 0, delay: f.delay, payments: f.payments, iban: iban || null, phone: f.phone.trim(), whatsapp: f.whatsapp };
    setBusy(true);
    const res = mySupplier ? await supabase.from("suppliers").update(row).eq("id", mySupplier.id) : await supabase.from("suppliers").insert(row);
    setBusy(false);
    if (res.error) return setErr("La boutique n'a pas pu être enregistrée.");
    await refreshRoles();
  }

  async function addProduct() {
    setPErr("");
    const price = Number(String(p.price).replace(",", "."));
    if (!(price > 0)) return setPErr("Indique un prix par paquet.");
    const { error } = await supabase.from("products").insert({ supplier_id: mySupplier.id, type: p.type, name: p.name.trim() || null, color: p.color, length: p.length ? parseInt(p.length, 10) : null, price });
    if (error) return setPErr("Le produit n'a pas pu être ajouté.");
    setP({ ...p, name: "", price: "", length: "" }); loadProducts();
  }

  return (
    <Screen>
      <Title size={24}>{mySupplier ? "Ma boutique" : "Ouvrir ma boutique de mèches"}</Title>
      {!mySupplier ? <Muted>Tes mèches sont proposées aux clientes et aux salons quand elles réservent. Tu livres au salon, avant le rendez-vous.</Muted> : null}
      <Field label="Nom de la boutique" value={f.name} onChangeText={set("name")} maxLength={60} placeholder="ex. Afro Hair Shop Matonge" />
      <Select label="Ville de la boutique" value={f.city} onChange={set("city")} options={CITIES} />
      <Label>Villes où tu livres</Label>
      <MultiChips options={CITIES} values={f.zones} onChange={set("zones")} />
      <Field label="Frais de livraison (€, 0 = offerte)" value={f.fee} onChangeText={set("fee")} keyboardType="decimal-pad" maxLength={6} placeholder="ex. 5" />
      <Select label="Délai de livraison" value={f.delay} onChange={set("delay")} options={DELAYS} />
      <Label>Modes de paiement acceptés</Label>
      <MultiChips options={PAY_METHODS} values={f.payments} onChange={set("payments")} />
      <Field label="IBAN pour les virements (montré seulement à qui choisit le virement)" value={f.iban} onChangeText={set("iban")} autoCapitalize="characters" maxLength={34} placeholder="BE68 5390 0754 7034" />
      <Field label="Téléphone" value={f.phone} onChangeText={set("phone")} keyboardType="phone-pad" maxLength={20} placeholder="ex. 0470 12 34 56" />
      <Row style={{ justifyContent: "space-between" }}><Body>Joignable sur WhatsApp</Body><Switch value={f.whatsapp} onValueChange={set("whatsapp")} trackColor={{ true: t.accent }} /></Row>
      <ErrorText>{err}</ErrorText>
      <Btn title={mySupplier ? "Enregistrer la boutique" : "Ouvrir ma boutique"} onPress={saveShop} loading={busy} />

      {mySupplier ? (
        <>
          <Title size={22} style={{ marginTop: 16 }}>Mes mèches en vente</Title>
          {!products.length ? <Muted>Aucun produit. Ajoute ton premier ci-dessous.</Muted> : null}
          {products.map((x) => (
            <Card key={x.id}>
              <Row wrap={false} gap={12}><Swatch color={x.color} size={30} />
                <View style={{ flex: 1 }}><Body style={{ fontWeight: "800" }}>{x.name || x.type}</Body><Muted>{x.type} · {x.color}{x.length ? ` · ${x.length}"` : ""} · {euro(x.price)}{x.in_stock ? "" : " · épuisé"}</Muted></View>
              </Row>
              <Row>
                <LinkBtn title={x.in_stock ? "Marquer épuisé" : "Remettre en stock"} onPress={async () => { await supabase.from("products").update({ in_stock: !x.in_stock }).eq("id", x.id); loadProducts(); }} />
                <LinkBtn danger title="Supprimer" onPress={async () => { await supabase.from("products").delete().eq("id", x.id); loadProducts(); }} />
              </Row>
            </Card>
          ))}
          <Card>
            <Body style={{ fontWeight: "800", fontSize: 17 }}>Ajouter un produit</Body>
            <Select label="Type" value={p.type} onChange={(v) => setP({ ...p, type: v })} options={MECHE_TYPES} />
            <Field label="Nom / marque" value={p.name} onChangeText={(v) => setP({ ...p, name: v })} maxLength={60} placeholder="ex. X-pression Ultra Braid" />
            <Select label="Couleur" value={p.color} onChange={(v) => setP({ ...p, color: v })} options={MECHE_COLORS} />
            <Row wrap={false} gap={10}>
              <View style={{ flex: 1 }}><Field label="Longueur (pouces)" value={p.length} onChangeText={(v) => setP({ ...p, length: v })} keyboardType="number-pad" maxLength={2} placeholder="26" /></View>
              <View style={{ flex: 1 }}><Field label="Prix / paquet (€)" value={p.price} onChangeText={(v) => setP({ ...p, price: v })} keyboardType="decimal-pad" maxLength={6} placeholder="4,50" /></View>
            </Row>
            <ErrorText>{pErr}</ErrorText>
            <Btn small title="Ajouter" onPress={addProduct} />
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
