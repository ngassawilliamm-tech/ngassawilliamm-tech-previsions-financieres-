import { useCallback, useState } from "react";
import { View, Linking, Text } from "react-native";
import { router, useLocalSearchParams, useFocusEffect, Stack } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { useTheme } from "../../lib/theme";
import { MODE_LABEL, waNumber, telLink, frDate } from "../../lib/constants";
import { Screen, Card, Row, Avatar, Title, Muted, Body, Chip, Rating, Btn, Stars, Loading, Label, LinkBtn } from "../../components/ui";
import { Seo, SITE_URL } from "../../lib/seo";
import Head from "expo-router/head";

export default function Salon() {
  const { id } = useLocalSearchParams(); const t = useTheme(); const { user, isAdmin } = useAuth();
  const [p, setP] = useState(null); const [rating, setRating] = useState(null); const [reviews, setReviews] = useState([]);

  useFocusEffect(useCallback(() => {
    (async () => {
      const [s, r, v] = await Promise.all([
        supabase.from("salons").select("*").eq("id", id).single(),
        supabase.from("salon_ratings").select("*").eq("salon_id", id).maybeSingle(),
        supabase.from("reviews").select("*").eq("salon_id", id).order("created_at", { ascending: false }).limit(50),
      ]);
      setP(s.data); setRating(r.data); setReviews(v.data ?? []);
    })();
  }, [id]));

  if (!p) return <Screen><Loading /></Screen>;
  const mapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(p.name + ", " + (p.address || p.city));
  const canEdit = user && (p.owner_id === user.id || (isAdmin && !p.owner_id));

  return (
    <Screen>
      <Stack.Screen options={{ title: p.name }} />
      <Seo
        title={`${p.name} – coiffeuse afro${p.city ? " à " + p.city : ""}`}
        description={`${p.name}${p.area ? ", " + p.area : ""}${p.city ? " à " + p.city : ""} : ${(p.styles || []).slice(0, 5).join(", ") || "tresses et coiffure afro"}. Avis des clientes et réservation en ligne sur Kitoko.`}
        path={`/salon/${p.id}`}
      />
      <SalonJsonLd p={p} rating={rating} />
      <Row wrap={false} gap={14}>
        <Avatar name={p.name} size={64} />
        <View style={{ flex: 1, gap: 4 }}>
          <Title size={26}>{p.name}</Title>
          <Muted>{[p.area, p.city].filter(Boolean).join(" · ")}</Muted>
        </View>
      </Row>
      <Row>
        <Chip label={MODE_LABEL[p.mode] || "En salon"} tone="gold" />
        {p.verified ? <Chip label="Vérifiée" tone="ok" /> : null}
        {p.owner_id ? <Chip label="Réservation dans l'app" tone="ok" /> : <Chip label="Fiche ajoutée par l'équipe" />}
      </Row>
      <Rating rating={rating} />
      <Btn title="Prendre rendez-vous" onPress={() => router.push(`/reserver/${p.id}`)} />
      {!p.owner_id ? <Muted>Ce salon n'a pas encore son espace Kitoko : l'équipe transmet ta demande et te répond dans l'app.</Muted> : null}

      <Card>
        <Label>Styles proposés</Label>
        <Row>{(p.styles || []).map((x) => <Chip key={x} label={x} tone="plain" />)}</Row>
        {p.bio ? <Body>{p.bio}</Body> : null}
        <Muted>{p.price_from ? `Prix dès ${p.price_from} €` : "Prix sur demande"}{p.languages?.length ? ` · ${p.languages.join(", ")}` : ""}</Muted>
      </Card>

      <Card>
        <Label>Contact</Label>
        {p.address ? <LinkBtn title={p.address} onPress={() => Linking.openURL(mapsUrl)} /> : null}
        {p.phone ? <Text selectable style={{ color: t.ink, fontWeight: "700", fontSize: 16 }}>{p.phone}</Text> : <Muted>Pas de numéro connu</Muted>}
        <Row>
          {p.phone ? <Btn small kind="ghost" title="Appeler" onPress={() => Linking.openURL(telLink(p.phone))} /> : null}
          {p.phone && p.whatsapp ? <Btn small kind="ghost" title="WhatsApp" onPress={() => Linking.openURL(`https://wa.me/${waNumber(p.phone)}`)} /> : null}
          {p.instagram ? <Btn small kind="ghost" title={p.instagram} onPress={() => Linking.openURL("https://instagram.com/" + p.instagram.replace(/^@/, ""))} /> : null}
          {p.website ? <Btn small kind="ghost" title="Site" onPress={() => Linking.openURL(p.website)} /> : null}
        </Row>
        {p.source ? <Muted>Source : {p.source}. Ce salon peut revendiquer sa fiche.</Muted> : null}
      </Card>

      <Title size={22}>Avis</Title>
      {!reviews.length ? <Muted>Pas encore d'avis. Seules les clientes dont le rendez-vous a été validé peuvent noter.</Muted> : null}
      {reviews.map((r) => (
        <Card key={r.id}>
          <Row><Stars value={r.stars} /><Chip label={r.satisfied ? "Satisfaite" : "Pas satisfaite"} tone={r.satisfied ? "ok" : undefined} /><Muted>Client vérifié · {frDate(r.created_at.slice(0, 10))}</Muted></Row>
          {r.comment ? <Body>{r.comment}</Body> : null}
          {isAdmin ? <LinkBtn danger title="Retirer cet avis (modération)" onPress={async () => { await supabase.from("reviews").delete().eq("id", r.id); setReviews(reviews.filter((x) => x.id !== r.id)); }} /> : null}
        </Card>
      ))}
      {canEdit ? <Btn kind="ghost" title="Modifier cette fiche" onPress={() => router.push({ pathname: "/pro/salon", params: { id: p.id } })} /> : null}
    </Screen>
  );
}

// Fiche « salon de coiffure » lisible par Google (résultats locaux, étoiles)
function SalonJsonLd({ p, rating }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: p.name,
    url: SITE_URL + "/salon/" + p.id,
    address: { "@type": "PostalAddress", streetAddress: p.address || undefined, addressLocality: p.city, addressCountry: "BE" },
    telephone: p.phone || undefined,
    priceRange: p.price_from ? `À partir de ${p.price_from} €` : undefined,
    knowsAbout: p.styles || undefined
  };
  if (rating && Number(rating.n_reviews) > 0) {
    data.aggregateRating = { "@type": "AggregateRating", ratingValue: Number(rating.avg_stars), reviewCount: Number(rating.n_reviews), bestRating: 5 };
  }
  return (
    <Head>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Head>
  );
}
