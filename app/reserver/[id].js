import { useEffect, useState } from "react";
import { View, ScrollView, Pressable, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { useTheme, R } from "../../lib/theme";
import { DURATION, TIMES, todayStr, addDays, shortDate, frDate, fmtDur } from "../../lib/constants";
import { Screen, Title, Muted, Label, Chip, Row, Field, Btn, ErrorText, Card, Loading } from "../../components/ui";
import { Seo } from "../../lib/seo";

export default function Reserver() {
  const { id } = useLocalSearchParams(); const t = useTheme(); const { user, profile } = useAuth();
  const [salon, setSalon] = useState(null);
  const [service, setService] = useState(""); const [date, setDate] = useState(""); const [time, setTime] = useState("10:00");
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [note, setNote] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(null);

  useEffect(() => { supabase.from("salons").select("*").eq("id", id).single().then(({ data }) => { setSalon(data); setService(data?.styles?.[0] ?? "Autre"); }); }, [id]);
  useEffect(() => { if (profile) { setName((n) => n || profile.first_name || ""); setPhone((p) => p || profile.phone || ""); } }, [profile]);

  if (!salon) return <Screen><Loading /></Screen>;
  if (!user) return (
    <Screen>
      <Seo title="Prendre rendez-vous" noindex />
      <Title size={24}>Connecte-toi pour réserver</Title>
      <Muted>Avec ton adresse e-mail et un mot de passe.</Muted>
      <Btn title="Me connecter" onPress={() => router.push("/connexion")} />
    </Screen>
  );

  const days = Array.from({ length: 45 }, (_, i) => addDays(todayStr(), i));
  const dur = DURATION[service] ?? 120;

  async function submit() {
    setErr("");
    if (!date) return setErr("Choisis une date.");
    if (!name.trim()) return setErr("Indique ton prénom.");
    if (phone.replace(/[^\d]/g, "").length < 9) return setErr("Indique un numéro de téléphone complet.");
    setBusy(true);
    const { data, error } = await supabase.from("bookings").insert({ salon_id: salon.id, service, date, time, duration_min: dur, first_name: name.trim(), phone: phone.trim(), note: note.trim() || null }).select().single();
    if (!error) await supabase.from("profiles").update({ first_name: name.trim(), phone: phone.trim() }).eq("id", user.id);
    setBusy(false);
    if (error) return setErr("La demande n'a pas pu être envoyée. Réessaie dans un instant.");
    setDone(data);
  }

  if (done) return (
    <Screen>
      <Card style={{ backgroundColor: t.okSoft, borderColor: t.okSoft }}>
        <Title size={22}>Demande envoyée</Title>
        <Text style={{ color: t.ink, fontWeight: "700" }}>{frDate(done.date)} à {done.time} · {done.service}</Text>
        <Muted>{salon.owner_id ? `${salon.name} reçoit une notification et te répond dans l'app.` : "L'équipe Kitoko transmet ta demande au salon et te répond dans l'app."}</Muted>
      </Card>
      <Btn title="Voir mes rendez-vous" onPress={() => { router.dismissAll?.(); router.replace("/espace"); }} />
      <Btn kind="ghost" title="Commander mes mèches, livrées au salon" onPress={() => { router.dismissAll?.(); router.replace("/meches"); }} />
    </Screen>
  );

  return (
    <Screen>
      <Title size={24}>{salon.name}</Title>
      <Label>Prestation</Label>
      <Row>{[...(salon.styles || []), "Autre"].map((s) => <Chip key={s} label={s} active={service === s} onPress={() => setService(s)} />)}</Row>
      <Muted>Durée estimée : {fmtDur(dur)} (le salon confirme)</Muted>

      <Label>Date</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {days.map((d) => {
          const on = d === date;
          return (
            <Pressable key={d} onPress={() => setDate(d)} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: R.md, borderWidth: 1, borderColor: on ? t.ink : t.line, backgroundColor: on ? t.ink : t.surface, alignItems: "center", minWidth: 64 }}>
              <Text style={{ color: on ? t.bg : t.muted, fontSize: 12, textTransform: "capitalize" }}>{shortDate(d).split(" ")[0]}</Text>
              <Text style={{ color: on ? t.bg : t.ink, fontSize: 20, fontWeight: "800" }}>{d.slice(8)}</Text>
              <Text style={{ color: on ? t.bg : t.muted, fontSize: 12 }}>{shortDate(d).split(" ").slice(2).join(" ")}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Label>Heure souhaitée</Label>
      <Row>{TIMES.map((h) => <Chip key={h} label={h} active={time === h} onPress={() => setTime(h)} />)}</Row>

      <Field label="Ton prénom" value={name} onChangeText={setName} maxLength={40} placeholder="ex. Aïcha" />
      <Field label="Ton téléphone (visible par le salon)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={20} placeholder="ex. 0470 12 34 56" />
      <Field label="Message pour le salon" value={note} onChangeText={setNote} multiline maxLength={300} placeholder="ex. Longueur mi-dos, je viens avec mes mèches" />
      <ErrorText>{err}</ErrorText>
      <Btn title="Envoyer la demande" onPress={submit} loading={busy} />
    </Screen>
  );
}
