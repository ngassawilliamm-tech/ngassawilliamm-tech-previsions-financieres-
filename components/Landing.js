// Page de référencement local : « Coiffeuse afro à <ville> » ou « <coiffure> en Belgique ».
// Le texte, les liens et la FAQ sont dans la page générée (lus directement par Google) ;
// la liste des salons se charge ensuite depuis Supabase.
import { useCallback, useState } from "react";
import { View, Text } from "react-native";
import { Link, router, useFocusEffect, Stack } from "expo-router";
import { supabase } from "../lib/supabase";
import { useTheme, R } from "../lib/theme";
import { MODE_LABEL } from "../lib/constants";
import { Screen, Card, Row, Avatar, Body, Muted, Chip, Rating, Btn, Eyebrow, Loading } from "./ui";
import { ShareButtons } from "./ShareButtons";
import { Seo } from "../lib/seo";

function H({ level = 2, children, size }) {
  const t = useTheme();
  return (
    <Text role="heading" aria-level={level} style={{ color: t.ink, fontSize: size ?? (level === 1 ? 34 : 22), lineHeight: (size ?? (level === 1 ? 34 : 22)) * 1.15, fontWeight: "800", letterSpacing: -0.5 }}>
      {children}
    </Text>
  );
}

function A({ href, children, strong }) {
  const t = useTheme();
  return (
    <Link href={href} style={{ color: strong ? t.accent : t.ink, fontWeight: strong ? "800" : "600", textDecorationLine: "underline", fontSize: 15 }}>
      {children}
    </Link>
  );
}

function LinkChips({ items }) {
  const t = useTheme();
  return (
    <Row gap={8}>
      {items.map(({ href, label }) => (
        <Link key={href} href={href} style={{ color: t.ink, backgroundColor: t.chip, borderRadius: R.pill, paddingHorizontal: 14, paddingVertical: 8, fontWeight: "600", fontSize: 14 }}>
          {label}
        </Link>
      ))}
    </Row>
  );
}

export default function Landing({ kind, title, h1, eyebrow, intro, paragraphs, faq, filter, crumbs, links, linksTitle, links2, links2Title, path, shareText, emptyText, searchParams }) {
  const t = useTheme();
  const [salons, setSalons] = useState(null);
  const [ratings, setRatings] = useState({});

  useFocusEffect(useCallback(() => {
    (async () => {
      const [s, r] = await Promise.all([supabase.from("salons").select("*").order("name"), supabase.from("salon_ratings").select("*")]);
      const m = {};
      (r.data ?? []).forEach((x) => { m[x.salon_id] = x; });
      setRatings(m);
      setSalons((s.data ?? []).filter(filter).sort((a, b) => (b.verified - a.verified) || ((m[b.id]?.avg_stars ?? 0) - (m[a.id]?.avg_stars ?? 0)) || a.name.localeCompare(b.name)));
    })();
  }, []));

  return (
    <Screen>
      <Stack.Screen options={{ title }} />
      <Seo title={title.replace(/ \| Kitoko$/, "")} />

      {/* Fil d'Ariane */}
      <Row gap={6}>
        {crumbs.map((c, i) => (
          <Row key={c.label} gap={6} wrap={false}>
            {i ? <Muted>›</Muted> : null}
            {c.href ? <Link href={c.href} style={{ color: t.muted, fontSize: 13 }}>{c.label}</Link> : <Muted style={{ fontSize: 13 }}>{c.label}</Muted>}
          </Row>
        ))}
      </Row>

      <View style={{ gap: 10 }}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <H level={1}>{h1}</H>
        <Body style={{ fontSize: 17, lineHeight: 26, color: t.muted }}>{intro}</Body>
      </View>

      <Row>
        <Btn title="Voir toutes les coiffeuses" onPress={() => router.push({ pathname: "/coiffeuses", params: searchParams })} />
        <Btn kind="ghost" title="Commander des mèches" onPress={() => router.push("/meches")} />
      </Row>

      <H>{kind === "ville" ? `Les coiffeuses afro à découvrir` : `Les coiffeuses qui proposent ce style`}</H>
      {salons === null ? <Loading /> : salons.length ? (
        salons.slice(0, 12).map((p) => (
          <Card key={p.id} onPress={() => router.push(`/salon/${p.id}`)}>
            <Row wrap={false} gap={12}>
              <Avatar name={p.name} />
              <View style={{ flex: 1, gap: 2 }}>
                <Body style={{ fontWeight: "800", fontSize: 17 }}>{p.name}</Body>
                <Muted>{[p.area, p.city].filter(Boolean).join(" · ")}</Muted>
                <Row style={{ marginTop: 4 }}>
                  <Chip label={MODE_LABEL[p.mode] || "En salon"} tone="gold" />
                  {p.verified ? <Chip label="Vérifiée" tone="ok" /> : null}
                </Row>
              </View>
            </Row>
            <Rating rating={ratings[p.id]} />
            <Row>{(p.styles || []).slice(0, 4).map((x) => <Chip key={x} label={x} tone="plain" />)}</Row>
          </Card>
        ))
      ) : (
        <Card>
          <Body style={{ fontWeight: "800" }}>{emptyText}</Body>
          <Muted>Tu coiffes ici ? Inscris ton salon gratuitement : les clientes te trouveront directement sur Kitoko.</Muted>
          <Row><Btn small title="Inscrire mon salon" onPress={() => router.push("/pro/salon")} /></Row>
        </Card>
      )}

      {paragraphs.map((p) => (
        <View key={p.title} style={{ gap: 8 }}>
          <H>{p.title}</H>
          <Body style={{ fontSize: 16, lineHeight: 25, color: t.muted }}>{p.text}</Body>
        </View>
      ))}

      <View style={{ gap: 10 }}>
        <H>{linksTitle}</H>
        <LinkChips items={links} />
      </View>
      {links2 ? (
        <View style={{ gap: 10 }}>
          <H>{links2Title}</H>
          <LinkChips items={links2} />
        </View>
      ) : null}

      <View style={{ gap: 12 }}>
        <H>Questions fréquentes</H>
        {faq.map((q) => (
          <Card key={q.q}>
            <Text role="heading" aria-level={3} style={{ color: t.ink, fontWeight: "800", fontSize: 16 }}>{q.q}</Text>
            <Muted style={{ fontSize: 15, lineHeight: 22 }}>{q.a}</Muted>
          </Card>
        ))}
      </View>

      <Card>
        <Body style={{ fontWeight: "800", fontSize: 17 }}>Partage cette page</Body>
        <Muted>Envoie-la à une amie qui cherche sa prochaine coiffure.</Muted>
        <ShareButtons path={path} text={shareText} />
      </Card>

      <Row gap={14}>
        <A href="/" strong>Accueil Kitoko</A>
        <A href="/coiffeuses">Toutes les coiffeuses</A>
        <A href="/meches">Mèches</A>
      </Row>
    </Screen>
  );
}
