import { useCallback, useEffect, useState } from "react";
import { View, Text, TextInput, Linking, RefreshControl } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/auth";
import { useActivity } from "../../lib/activity";
import { useTheme, R } from "../../lib/theme";
import { BOOKING_STATUS, ORDER_STATUS, todayStr, frDate, fmtDur, euro, waNumber } from "../../lib/constants";
import { Screen, Title, Muted, Body, Card, Row, Btn, Chip, LinkBtn, Empty, Label, Eyebrow } from "../../components/ui";

const pad = (n) => String(n).padStart(2, "0");
function gcal(title, date, time, durMin, details, location) {
  const [y, mo, d] = date.split("-").map(Number); const [h, mi] = time.split(":").map(Number);
  const s = new Date(y, mo - 1, d, h, mi), e = new Date(s.getTime() + durMin * 60000);
  const f = (x) => `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${f(s)}/${f(e)}&ctz=Europe/Brussels&details=${encodeURIComponent(details)}${location ? "&location=" + encodeURIComponent(location) : ""}`;
}
const bTone = { attente: "gold", confirme: "ok" };
const oTone = { envoyee: "gold", acceptee: "gold", en_route: "gold", livree: "ok" };

function DateBox({ date, top, bottom, t }) {
  const [y, m, d] = date.split("-").map(Number);
  return (
    <View style={{ alignItems: "center", minWidth: 58 }}>
      <Text style={{ color: t.muted, fontSize: 11, textTransform: "uppercase" }}>{top ?? new Date(y, m - 1, d).toLocaleDateString("fr-BE", { month: "short" })}</Text>
      <Text style={{ color: t.ink, fontSize: 26, fontWeight: "800" }}>{d}</Text>
      <Text style={{ color: t.muted, fontSize: 12 }}>{bottom}</Text>
    </View>
  );
}

function MessageInput({ value, onChange, t, placeholder }) {
  return <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={t.muted} maxLength={300}
    style={{ borderWidth: 1, borderColor: t.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, color: t.ink, backgroundColor: t.bg }} />;
}

// Rendez-vous vu par la cliente ou par le salon
function BookingCard({ b, mode, t, reload, reviewed }) {
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const salon = b.salons || {};
  const loc = salon.address || [salon.area, salon.city].filter(Boolean).join(", ");
  const past = b.date <= todayStr();
  const act = async (patch) => { setBusy(true); const { error } = await supabase.from("bookings").update(patch).eq("id", b.id); setBusy(false); if (!error) reload(); };
  return (
    <Card highlight={mode !== "client" && b.status === "attente"}>
      <Row wrap={false} gap={12} style={{ alignItems: "flex-start" }}>
        <DateBox date={b.date} bottom={b.time} t={t} />
        <View style={{ flex: 1, gap: 4 }}>
          <Body style={{ fontWeight: "800" }}>{mode === "client" ? salon.name : `${b.first_name} · ${b.service}`}{mode === "equipe" ? ` (${salon.name})` : ""}</Body>
          <Muted>{mode === "client" ? `${b.service} · ` : ""}{frDate(b.date)} · {fmtDur(b.duration_min)}</Muted>
          {mode !== "client" && b.phone ? <Text selectable style={{ color: t.ink }}>Tél. {b.phone}</Text> : null}
          {mode !== "client" && b.note ? <Muted>« {b.note} »</Muted> : null}
          <Row><Chip label={BOOKING_STATUS[b.status]} tone={bTone[b.status]} /></Row>
          {b.salon_message ? <Muted>{mode === "client" ? "Message du salon : " : "Ton message : "}{b.salon_message}</Muted> : null}
        </View>
      </Row>
      {mode !== "client" && b.status === "attente" ? (
        <>
          <MessageInput t={t} value={msg} onChange={setMsg} placeholder="Message à la cliente (optionnel), ex. « Plutôt 14 h ? »" />
          <Row>
            <Btn small title="Valider" loading={busy} onPress={() => act({ status: "confirme", salon_message: msg || null })} />
            <Btn small kind="ghost" title="Refuser" disabled={busy} onPress={() => act({ status: "refuse", salon_message: msg || null })} />
            {mode === "equipe" && salon.phone && salon.whatsapp ? <LinkBtn title="Transmettre au salon (WhatsApp)" onPress={() => Linking.openURL(`https://wa.me/${waNumber(salon.phone)}?text=${encodeURIComponent(`Bonjour ${salon.name}, une cliente souhaite un rendez-vous via Kitoko :\n• ${b.service}\n• ${frDate(b.date)} à ${b.time}\n• ${b.first_name}${b.note ? "\n• " + b.note : ""}\n\nEst-ce possible ?`)}`)} /> : null}
          </Row>
        </>
      ) : null}
      <Row>
        {b.status === "confirme" ? <LinkBtn title="Ajouter à mon agenda" onPress={() => Linking.openURL(mode === "client"
          ? gcal(`Coiffure : ${salon.name} – ${b.service}`, b.date, b.time, b.duration_min, "Rendez-vous confirmé via Kitoko.", loc)
          : gcal(`RDV ${b.first_name} – ${b.service}`, b.date, b.time, b.duration_min, `Cliente : ${b.first_name}${b.phone ? " (" + b.phone + ")" : ""}${b.note ? "\nNote : " + b.note : ""}`, loc))} /> : null}
        {mode === "client" && !past && ["attente", "confirme"].includes(b.status) ? <LinkBtn danger title="Annuler" onPress={() => act({ status: "annule" })} /> : null}
        {mode === "client" && past && b.status === "confirme" && !reviewed ? <Btn small title="Laisser un avis" onPress={() => router.push(`/avis/${b.id}`)} /> : null}
        {mode === "client" && reviewed ? <Chip label="Avis publié" tone="ok" /> : null}
      </Row>
    </Card>
  );
}

// Commande vue par l'acheteur, le fournisseur ou le salon de livraison
function OrderCard({ o, mode, t, reload }) {
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const act = async (patch) => { setBusy(true); const { error } = await supabase.from("orders").update(patch).eq("id", o.id); setBusy(false); if (!error) reload(); };
  const next = { envoyee: [["acceptee", "Accepter"], ["refusee", "Refuser"]], acceptee: [["en_route", "En route"]], en_route: [["livree", "Marquer livrée"]] }[o.status] || [];
  const qty = (o.lines || []).reduce((a, l) => a + l.qty, 0);
  const dest = o.deliver_kind === "salon" ? `${o.salons?.name ?? "Salon"}${o.salons?.address ? ", " + o.salons.address : ""}` : o.deliver_address;
  return (
    <Card highlight={mode === "fournisseur" && o.status === "envoyee"}>
      <Row wrap={false} gap={12} style={{ alignItems: "flex-start" }}>
        <DateBox date={o.needed_by} top="avant le" bottom={new Date(o.needed_by + "T12:00:00").toLocaleDateString("fr-BE", { month: "short" })} t={t} />
        <View style={{ flex: 1, gap: 4 }}>
          <Body style={{ fontWeight: "800" }}>{mode === "client" ? o.suppliers?.name : mode === "salon" ? `Colis de ${o.suppliers?.name} pour ${o.buyer_name}` : `${o.buyer_name} · ${qty} paquets`}</Body>
          {(o.lines || []).map((l, i) => <Muted key={i}>{l.qty} × {l.label}{mode !== "salon" ? ` · ${euro(l.qty * l.price)}` : ""}</Muted>)}
          {mode !== "salon" ? <Muted>Total : {euro(Number(o.total) + Number(o.fee))} · {o.payment_method}</Muted> : null}
          <Muted>Livraison : {dest}</Muted>
          {o.bookings ? <Muted>Pour le rendez-vous du {frDate(o.bookings.date)} à {o.bookings.time}</Muted> : null}
          {o.note && mode !== "salon" ? <Muted>« {o.note} »</Muted> : null}
          <Row>
            <Chip label={ORDER_STATUS[o.status]} tone={oTone[o.status]} />
            {mode !== "salon" ? <Chip label={o.paid ? "Payé" : "Non payé"} tone={o.paid ? "ok" : undefined} /> : null}
          </Row>
          {o.supplier_message ? <Muted>{mode === "fournisseur" ? "Ton message : " : "Message du fournisseur : "}{o.supplier_message}</Muted> : null}
          {mode === "client" && !o.paid && o.payment_method.startsWith("Virement") && !["annulee", "refusee"].includes(o.status)
            ? <Text selectable style={{ color: t.ink }}>{o.suppliers?.iban ? `IBAN : ${o.suppliers.iban}\nCommunication : Kitoko ${o.id.slice(0, 8)}` : "Demande les coordonnées bancaires au fournisseur."}</Text> : null}
        </View>
      </Row>
      {mode === "fournisseur" && next.length ? (
        <>
          <MessageInput t={t} value={msg} onChange={setMsg} placeholder="Message à l'acheteur (optionnel)" />
          <Row>{next.map(([s, label], i) => <Btn key={s} small kind={i === 0 ? "primary" : "ghost"} title={label} disabled={busy} onPress={() => act({ status: s, supplier_message: msg || o.supplier_message })} />)}</Row>
        </>
      ) : null}
      <Row>
        {mode === "fournisseur" && !["refusee", "annulee"].includes(o.status) ? <LinkBtn title={o.paid ? "Annuler « payé »" : "Paiement reçu"} onPress={() => act({ paid: !o.paid })} /> : null}
        {mode === "client" && o.status === "envoyee" ? <LinkBtn danger title="Annuler la commande" onPress={() => act({ status: "annulee" })} /> : null}
      </Row>
    </Card>
  );
}

function Section({ title, children, empty }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  return (
    <View style={{ gap: 10 }}>
      <Title size={22} style={{ marginTop: 10 }}>{title}</Title>
      {Array.isArray(items) && !items.length ? <Muted>{empty}</Muted> : items}
    </View>
  );
}

function DeleteAccount({ signOut }) {
  const [armed, setArmed] = useState(false); const [err, setErr] = useState("");
  return (
    <View style={{ marginTop: 24, gap: 6 }}>
      <LinkBtn danger title={armed ? "Confirmer : supprimer définitivement mon compte" : "Supprimer mon compte"} onPress={async () => {
        if (!armed) { setArmed(true); return; }
        const { error } = await supabase.rpc("delete_my_account");
        if (error) { setErr("La suppression n'a pas pu se faire. Réessaie ou écris à l'équipe Kitoko."); return; }
        await signOut();
      }} />
      {armed ? <Muted>Tes rendez-vous, commandes, avis et ta boutique seront effacés. Ta fiche salon reste visible sans compte.</Muted> : null}
      {err ? <Muted>{err}</Muted> : null}
    </View>
  );
}

export default function Espace() {
  const t = useTheme(); const { user, mySalon, mySupplier, isAdmin, profile, signOut, refreshRoles } = useAuth(); const { version, refresh } = useActivity();
  const [d, setD] = useState(null); const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const t0 = todayStr();
    const bSel = "*, salons(name,address,area,city,phone,whatsapp,owner_id)";
    const oSel = "*, suppliers(name,iban,phone), salons!orders_deliver_salon_id_fkey(name,address), bookings(date,time)";
    const q = [
      supabase.from("bookings").select(bSel).eq("client_id", user.id).order("date", { ascending: false }).limit(50),
      supabase.from("orders").select(oSel).eq("buyer_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("reviews").select("booking_id").eq("client_id", user.id),
      mySalon ? supabase.from("bookings").select(bSel).eq("salon_id", mySalon.id).gte("date", t0).in("status", ["attente", "confirme"]).order("date").order("time") : null,
      mySupplier ? supabase.from("orders").select(oSel).eq("supplier_id", mySupplier.id).in("status", ["envoyee", "acceptee", "en_route"]).order("needed_by") : null,
      mySalon ? supabase.from("orders").select(oSel).eq("deliver_salon_id", mySalon.id).neq("buyer_id", user.id).in("status", ["envoyee", "acceptee", "en_route"]).order("needed_by") : null,
      isAdmin ? supabase.from("bookings").select("*, salons!inner(name,address,area,city,phone,whatsapp,owner_id)").is("salons.owner_id", null).gte("date", t0).in("status", ["attente", "confirme"]).order("date") : null,
    ].map((x) => x ?? Promise.resolve({ data: [] }));
    const [mb, mo, rv, sb, so, sc, ab] = await Promise.all(q);
    setD({ myBookings: mb.data ?? [], myOrders: mo.data ?? [], reviewed: new Set((rv.data ?? []).map((r) => r.booking_id)), salonBookings: sb.data ?? [], supplierOrders: so.data ?? [], parcels: sc.data ?? [], teamBookings: ab.data ?? [] });
  }, [user?.id, mySalon?.id, mySupplier?.id, isAdmin]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [version]);
  const reload = () => { load(); refresh(); };

  if (!user) return (
    <Screen>
      <Eyebrow>Mon espace</Eyebrow>
      <Title>Connecte-toi pour suivre tes rendez-vous et tes commandes</Title>
      <Muted>Avec ton adresse e-mail et un mot de passe.</Muted>
      <Btn title="Me connecter" onPress={() => router.push("/connexion")} />
      <Card style={{ marginTop: 12 }}>
        <Body style={{ fontWeight: "800", fontSize: 17 }}>Tu es professionnel(le) ?</Body>
        <Muted>Coiffeuses, salons et vendeurs de mèches : connecte-toi, puis crée ton espace pro. C'est gratuit.</Muted>
      </Card>
    </Screen>
  );

  const pendingSalon = d?.salonBookings.filter((b) => b.status === "attente") ?? [];
  const upcomingSalon = d?.salonBookings.filter((b) => b.status === "confirme") ?? [];
  const teamPending = d?.teamBookings.filter((b) => b.status === "attente") ?? [];

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await Promise.all([load(), refreshRoles()]); setRefreshing(false); }} tintColor={t.accent} />}>
      <Row style={{ justifyContent: "space-between" }}>
        <Title>Bonjour{profile?.first_name ? ` ${profile.first_name}` : ""}</Title>
        <LinkBtn title="Se déconnecter" onPress={signOut} />
      </Row>

      {mySalon ? (
        <>
          <Section title={`Demandes · ${mySalon.name}`} empty="Aucune nouvelle demande.">{pendingSalon.map((b) => <BookingCard key={b.id} b={b} mode="salon" t={t} reload={reload} />)}</Section>
          <Section title="Rendez-vous à venir" empty="Aucun rendez-vous confirmé à venir.">{upcomingSalon.map((b) => <BookingCard key={b.id} b={b} mode="salon" t={t} reload={reload} />)}</Section>
          {d?.parcels.length ? <Section title="Colis attendus au salon" empty="">{d.parcels.map((o) => <OrderCard key={o.id} o={o} mode="salon" t={t} reload={reload} />)}</Section> : null}
        </>
      ) : null}

      {mySupplier ? (
        <Section title={`Commandes · ${mySupplier.name}`} empty="Aucune commande en cours.">{(d?.supplierOrders ?? []).map((o) => <OrderCard key={o.id} o={o} mode="fournisseur" t={t} reload={reload} />)}</Section>
      ) : null}

      {isAdmin ? (
        <Section title="Équipe · salons sans espace" empty="Aucune demande pour les salons importés.">{[...teamPending, ...(d?.teamBookings.filter((b) => b.status === "confirme") ?? [])].map((b) => <BookingCard key={b.id} b={b} mode="equipe" t={t} reload={reload} />)}</Section>
      ) : null}

      <Section title="Mes rendez-vous" empty="Aucun rendez-vous pour l'instant.">{(d?.myBookings ?? []).map((b) => <BookingCard key={b.id} b={b} mode="client" t={t} reload={reload} reviewed={d.reviewed.has(b.id)} />)}</Section>
      {!d?.myBookings.length ? <Btn kind="ghost" title="Trouver une coiffeuse" onPress={() => router.push("/coiffeuses")} /> : null}

      <Section title="Mes commandes de mèches" empty="Aucune commande pour l'instant.">{(d?.myOrders ?? []).map((o) => <OrderCard key={o.id} o={o} mode="client" t={t} reload={reload} />)}</Section>

      <Title size={22} style={{ marginTop: 10 }}>Espace pro</Title>
      <Card onPress={() => router.push("/pro/salon")}>
        <Body style={{ fontWeight: "800", fontSize: 17 }}>{mySalon ? "Modifier mon salon" : "Je coiffe : créer mon espace"}</Body>
        <Muted>{mySalon ? "Styles, prix, contact, présentation." : "Les clientes te trouvent, réservent et tu valides dans l'app."}</Muted>
      </Card>
      <Card onPress={() => router.push("/pro/boutique")}>
        <Body style={{ fontWeight: "800", fontSize: 17 }}>{mySupplier ? "Gérer ma boutique de mèches" : "Je vends des mèches : ouvrir ma boutique"}</Body>
        <Muted>{mySupplier ? "Produits, prix, zones de livraison, paiements." : "Tes mèches livrées au salon des clientes, avant leur rendez-vous."}</Muted>
      </Card>
      <DeleteAccount signOut={signOut} />
    </Screen>
  );
}
