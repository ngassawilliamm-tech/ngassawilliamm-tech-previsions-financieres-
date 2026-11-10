import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useTheme } from "../../lib/theme";
import { frDate } from "../../lib/constants";
import { Screen, Title, Muted, Label, Row, Chip, Field, Btn, ErrorText, Loading } from "../../components/ui";
import { Seo } from "../../lib/seo";

export default function Avis() {
  const { bookingId } = useLocalSearchParams(); const t = useTheme();
  const [b, setB] = useState(null); const [stars, setStars] = useState(0); const [sat, setSat] = useState(null); const [comment, setComment] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  useEffect(() => { supabase.from("bookings").select("*, salons(name)").eq("id", bookingId).single().then(({ data }) => setB(data)); }, [bookingId]);
  if (!b) return <Screen><Loading /></Screen>;

  async function save() {
    setErr("");
    if (!stars) return setErr("Choisis une note de 1 à 5 étoiles.");
    if (sat === null) return setErr("Dis-nous si tu es satisfaite ou pas.");
    setBusy(true);
    const { error } = await supabase.from("reviews").insert({ booking_id: b.id, salon_id: b.salon_id, stars, satisfied: sat, comment: comment.trim() || null });
    setBusy(false);
    if (error) return setErr(error.code === "23505" ? "Tu as déjà donné ton avis pour ce rendez-vous." : "Ton avis n'a pas pu être enregistré. Le rendez-vous doit être validé et passé.");
    router.back();
  }

  return (
    <Screen>
      <Seo title="Mon avis" noindex />
      <Title size={24}>{b.salons?.name}</Title>
      <Muted>{b.service} · {frDate(b.date)}</Muted>
      <Label>Ta note</Label>
      <Row gap={4}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Pressable key={i} onPress={() => setStars(i)} accessibilityRole="button" accessibilityLabel={`${i} étoile${i > 1 ? "s" : ""}`} hitSlop={4}>
            <Text style={{ fontSize: 40, color: i <= stars ? t.gold : t.line }}>★</Text>
          </Pressable>
        ))}
      </Row>
      <Label>Es-tu satisfaite ?</Label>
      <Row><Chip label="Oui, satisfaite" active={sat === true} onPress={() => setSat(true)} /><Chip label="Non, pas satisfaite" active={sat === false} onPress={() => setSat(false)} /></Row>
      <Field label="Ton commentaire" value={comment} onChangeText={setComment} multiline maxLength={500} placeholder="Accueil, ponctualité, résultat, prix…" />
      <ErrorText>{err}</ErrorText>
      <Btn title="Publier mon avis" onPress={save} loading={busy} />
    </Screen>
  );
}
