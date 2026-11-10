import { useEffect, useState } from "react";
import { Switch, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { useTheme } from "../../lib/theme";
import { CITIES, STYLES, MODE_LABEL } from "../../lib/constants";
import { Screen, Title, Muted, Label, Field, Select, MultiChips, Btn, ErrorText, Row, Body } from "../../components/ui";
import { Seo } from "../../lib/seo";

const LANGS = ["Français", "Néerlandais", "Anglais", "Lingala", "Swahili", "Portugais", "Arabe", "Wolof"];

// Création ou modification d'une fiche salon (la sienne, ou un salon importé pour l'équipe)
export default function ProSalon() {
  const { id } = useLocalSearchParams(); const t = useTheme(); const { user, mySalon, isAdmin, refreshRoles } = useAuth();
  const [f, setF] = useState({ name: "", mode: "salon", city: "Bruxelles", area: "", address: "", styles: [], price_from: "", phone: "", whatsapp: true, instagram: "", website: "", languages: ["Français"], bio: "" });
  const [editId, setEditId] = useState(null); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    const load = async () => {
      let s = null;
      if (id) s = (await supabase.from("salons").select("*").eq("id", id).single()).data;
      else s = mySalon;
      if (s) { setEditId(s.id); setF({ ...s, price_from: s.price_from ? String(s.price_from) : "", area: s.area ?? "", address: s.address ?? "", instagram: s.instagram ?? "", website: s.website ?? "", bio: s.bio ?? "", phone: s.phone ?? "" }); }
    };
    load();
  }, [id, mySalon?.id]);

  if (!user) return <Screen><Title size={24}>Connecte-toi d'abord</Title><Btn title="Me connecter" onPress={() => router.push("/connexion")} /></Screen>;

  async function save() {
    setErr("");
    if (f.name.trim().length < 2) return setErr("Indique le nom du salon ou ton nom.");
    if (!f.styles.length) return setErr("Choisis au moins un style.");
    if (f.phone.replace(/[^\d]/g, "").length < 9) return setErr("Indique un numéro de téléphone complet.");
    if (f.website && !/^https?:\/\//.test(f.website)) return setErr("L'adresse du site doit commencer par https://");
    const row = { name: f.name.trim(), mode: f.mode, city: f.city, area: f.area.trim() || null, address: f.address.trim() || null, styles: f.styles,
      price_from: f.price_from ? Math.max(0, parseInt(f.price_from, 10) || 0) : null, phone: f.phone.trim(), whatsapp: f.whatsapp,
      instagram: f.instagram.trim() || null, website: f.website.trim() || null, languages: f.languages, bio: f.bio.trim() || null };
    setBusy(true);
    const res = editId ? await supabase.from("salons").update(row).eq("id", editId) : await supabase.from("salons").insert({ ...row, owner_id: user.id });
    setBusy(false);
    if (res.error) return setErr(res.error.code === "23505" ? "Tu as déjà un salon sur ce compte." : "La fiche n'a pas pu être enregistrée.");
    await refreshRoles(); router.back();
  }

  return (
    <Screen>
      <Seo title="Mon salon" noindex />
      <Title size={24}>{editId ? "Modifier la fiche" : "Créer mon espace salon"}</Title>
      {!editId ? <Muted>Les clientes te trouvent, réservent, et tu valides les rendez-vous dans « Mon espace ». Gratuit, sans commission.</Muted> : null}
      <Field label="Nom du salon ou ton nom" value={f.name} onChangeText={set("name")} maxLength={60} placeholder="ex. Salon Nadège Beauty" />
      <Select label="Tu coiffes" value={f.mode} onChange={set("mode")} options={Object.entries(MODE_LABEL).map(([value, label]) => ({ value, label }))} />
      <Select label="Ville" value={f.city} onChange={set("city")} options={CITIES} />
      <Field label="Commune ou quartier" value={f.area} onChangeText={set("area")} maxLength={50} placeholder="ex. Ixelles (Matonge)" />
      <Field label="Adresse du salon (vide si tu coiffes chez toi)" value={f.address} onChangeText={set("address")} maxLength={120} placeholder="ex. Chaussée de Wavre 30, 1050 Ixelles" />
      <Label>Styles proposés</Label>
      <MultiChips options={STYLES} values={f.styles} onChange={set("styles")} />
      <Field label="Prix à partir de (€)" value={f.price_from} onChangeText={set("price_from")} keyboardType="number-pad" maxLength={4} placeholder="ex. 45" />
      <Field label="Téléphone" value={f.phone} onChangeText={set("phone")} keyboardType="phone-pad" maxLength={20} placeholder="ex. 0470 12 34 56" />
      <Row style={{ justifyContent: "space-between" }}><Body>Joignable sur WhatsApp</Body><Switch value={f.whatsapp} onValueChange={set("whatsapp")} trackColor={{ true: t.accent }} /></Row>
      <Field label="Instagram" value={f.instagram} onChangeText={set("instagram")} autoCapitalize="none" maxLength={40} placeholder="@toncompte" />
      <Field label="Site ou page de réservation" value={f.website} onChangeText={set("website")} autoCapitalize="none" maxLength={200} placeholder="https://…" />
      <Label>Langues parlées</Label>
      <MultiChips options={LANGS} values={f.languages} onChange={set("languages")} />
      <Field label="Présentation" value={f.bio} onChangeText={set("bio")} multiline maxLength={300} placeholder="ex. Spécialiste knotless et locks depuis 8 ans." />
      <ErrorText>{err}</ErrorText>
      <Btn title={editId ? "Enregistrer" : "Publier ma fiche"} onPress={save} loading={busy} />
      {editId && isAdmin ? <Muted>Équipe : tu modifies cette fiche au nom du salon.</Muted> : null}
      <View style={{ height: 20 }} />
    </Screen>
  );
}
