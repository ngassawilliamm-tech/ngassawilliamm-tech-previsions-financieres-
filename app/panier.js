import { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { useCart } from "../lib/cart";
import { useTheme, R } from "../lib/theme";
import { CITIES, euro, todayStr, addDays, shortDate, frDate } from "../lib/constants";
import { Screen, Title, Muted, Label, Card, Row, Btn, Field, Select, ErrorText, Body, LinkBtn, Empty, Chip } from "../components/ui";

function Radio({ label, on, onPress, t }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: on }}
      style={{ flexDirection: "row", gap: 10, alignItems: "center", borderWidth: 1, borderColor: on ? t.accent : t.line, borderRadius: 10, padding: 12, backgroundColor: t.surface }}>
      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: on ? t.accent : t.muted, alignItems: "center", justifyContent: "center" }}>
        {on ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.accent }} /> : null}
      </View>
      <Text style={{ color: t.ink, fontSize: 15, flex: 1 }}>{label}</Text>
    </Pressable>
  );
}

export default function Panier() {
  const t = useTheme(); const { user, mySalon, profile } = useAuth(); const cart = useCart();
  const [bookings, setBookings] = useState([]); const [salons, setSalons] = useState([]);
  const [where, setWhere] = useState(""); const [otherSalon, setOtherSalon] = useState(""); const [addr, setAddr] = useState(""); const [addrCity, setAddrCity] = useState("Bruxelles");
  const [need, setNeed] = useState(""); const [name, setName] = useState(""); const [note, setNote] = useState("");
  const [pay, setPay] = useState({}); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [b, s] = await Promise.all([
        supabase.from("bookings").select("id,date,time,service,status,salon_id,salons(name,address,city,area)").eq("client_id", user.id).gte("date", todayStr()).in("status", ["attente", "confirme"]).order("date"),
        supabase.from("salons").select("id,name,city,address,area").order("name"),
      ]);
      setBookings(b.data ?? []); setSalons(s.data ?? []);
      if (b.data?.length) { setWhere("rdv:" + b.data[0].id); setNeed(b.data[0].date); } else if (mySalon) setWhere("salon:" + mySalon.id); else setWhere("autre-salon");
    })();
  }, [user?.id]);
  useEffect(() => { if (profile?.first_name) setName((n) => n || profile.first_name); }, [profile]);

  const groups = useMemo(() => {
    const g = {}; cart.items.forEach((x) => { (g[x.supplier.id] = g[x.supplier.id] || { s: x.supplier, lines: [] }).lines.push(x); }); return Object.values(g);
  }, [cart.items]);

  function destination() {
    if (where.startsWith("rdv:")) { const b = bookings.find((x) => "rdv:" + x.id === where); return b && { kind: "salon", salonId: b.salon_id, name: b.salons?.name, address: b.salons?.address || [b.salons?.area, b.salons?.city].filter(Boolean).join(", "), city: b.salons?.city, bookingId: b.id }; }
    if (where.startsWith("salon:") || where === "autre-salon") { const id = where === "autre-salon" ? otherSalon : where.slice(6); const p = salons.find((x) => x.id === id) || (mySalon?.id === id ? mySalon : null); return p && { kind: "salon", salonId: p.id, name: p.name, address: p.address || [p.area, p.city].filter(Boolean).join(", "), city: p.city, bookingId: null }; }
    return { kind: "adresse", salonId: null, name: "", address: addr.trim(), city: addrCity, bookingId: null };
  }
  const dest = destination();

  if (done) return (
    <Screen>
      <Card style={{ backgroundColor: t.okSoft, borderColor: t.okSoft }}>
        <Title size={22}>Commande envoyée</Title>
        <Muted>Le fournisseur reçoit une notification. Tu suis la livraison dans « Mon espace ».{done.dest.kind === "salon" ? " Le salon voit aussi le colis attendu." : ""}</Muted>
      </Card>
      {done.orders.filter((o) => o.payment_method.startsWith("Virement")).map((o) => (
        <Card key={o.id}>
          <Body style={{ fontWeight: "800" }}>Virement à faire : {euro(Number(o.total) + Number(o.fee))}</Body>
          <Text selectable style={{ color: t.ink }}>{o.iban ? `IBAN : ${o.iban}\nCommunication : Kitoko ${o.id.slice(0, 8)}` : "Le fournisseur t'enverra ses coordonnées bancaires."}</Text>
          <Muted>La commande part dès que le fournisseur a reçu le virement.</Muted>
        </Card>
      ))}
      <Btn title="Voir mes commandes" onPress={() => { router.dismissAll?.(); router.replace("/espace"); }} />
    </Screen>
  );
  if (!cart.items.length) return <Screen><Empty title="Ton panier est vide" text="Ajoute des mèches depuis la rubrique Mèches." action={<Btn small title="Voir les mèches" onPress={() => router.back()} />} /></Screen>;
  if (!user) return <Screen><Title size={24}>Connecte-toi pour commander</Title><Btn title="Me connecter" onPress={() => router.push("/connexion")} /></Screen>;

  const whereOptions = [
    ...bookings.map((b) => ({ label: `Mon rendez-vous : ${b.salons?.name}, ${shortDate(b.date)} à ${b.time}`, value: "rdv:" + b.id })),
    ...(mySalon ? [{ label: `Mon salon : ${mySalon.name}`, value: "salon:" + mySalon.id }] : []),
    { label: "Un autre salon de l'annuaire", value: "autre-salon" },
    { label: "Une autre adresse", value: "adresse" },
  ];
  const needDays = Array.from({ length: 30 }, (_, i) => addDays(todayStr(), i + 1));

  async function order() {
    setErr("");
    if (!dest || (dest.kind === "salon" && !dest.salonId)) return setErr("Choisis le lieu de livraison.");
    if (dest.kind === "adresse" && dest.address.length < 8) return setErr("Indique l'adresse complète de livraison.");
    if (!need) return setErr("Choisis la date à laquelle tu as besoin des mèches.");
    if (!name.trim()) return setErr("Indique ton prénom.");
    setBusy(true);
    const rows = groups.map(({ s, lines }) => {
      const L = lines.map((x) => ({ product_id: x.product.id, label: `${x.product.name || x.product.type} · ${x.product.color}${x.product.length ? ` · ${x.product.length}"` : ""}`, qty: x.qty, price: Number(x.product.price) }));
      return { supplier_id: s.id, lines: L, total: L.reduce((a, l) => a + l.qty * l.price, 0), fee: Number(s.fee) || 0, payment_method: pay[s.id] || (s.payments || [])[0] || "Espèces à la livraison",
        buyer_name: name.trim(), deliver_kind: dest.kind, deliver_salon_id: dest.salonId, deliver_address: dest.address, deliver_city: dest.city, booking_id: dest.bookingId, needed_by: need, note: note.trim() || null };
    });
    const { data, error } = await supabase.from("orders").insert(rows).select();
    setBusy(false);
    if (error) return setErr("La commande n'a pas pu être envoyée. Réessaie dans un instant.");
    const withIban = (data ?? []).map((o) => ({ ...o, iban: groups.find((g) => g.s.id === o.supplier_id)?.s.iban }));
    cart.clear(groups.map((g) => g.s.id)); setDone({ orders: withIban, dest });
  }

  return (
    <Screen>
      {groups.map(({ s, lines }) => {
        const total = lines.reduce((a, x) => a + x.qty * Number(x.product.price), 0) + (Number(s.fee) || 0);
        const city = dest?.city; const outside = city && !(s.zones || []).includes(city);
        const methods = (s.payments && s.payments.length) ? s.payments : ["Espèces à la livraison"];
        return (
          <Card key={s.id}>
            <Body style={{ fontWeight: "800", fontSize: 17 }}>{s.name} ({s.city})</Body>
            {lines.map((x) => (
              <Row key={x.product.id} style={{ justifyContent: "space-between" }}>
                <Muted style={{ flex: 1 }}>{x.qty} × {x.product.name || x.product.type} · {x.product.color}</Muted>
                <Body>{euro(x.qty * x.product.price)}</Body>
                <LinkBtn danger title="Retirer" onPress={() => cart.setQty(x.product.id, 0)} />
              </Row>
            ))}
            <Muted>Livraison {Number(s.fee) ? euro(s.fee) : "offerte"} · {s.delay}</Muted>
            <Body style={{ fontWeight: "800" }}>Total à payer : {euro(total)}</Body>
            {outside ? <ErrorText>{s.name} ne livre pas à {city} : le fournisseur te proposera une solution ou refusera.</ErrorText> : null}
            <Label>Comment veux-tu payer ?</Label>
            <View style={{ gap: 8 }}>
              {methods.map((m) => <Radio key={m} t={t} label={m} on={(pay[s.id] || methods[0]) === m} onPress={() => setPay({ ...pay, [s.id]: m })} />)}
            </View>
          </Card>
        );
      })}

      <Select label="Livrer où ?" value={where} onChange={(v) => { setWhere(v); const b = bookings.find((x) => "rdv:" + x.id === v); if (b) setNeed(b.date); }} options={whereOptions} />
      {where === "autre-salon" ? <Select label="Salon" value={otherSalon} onChange={setOtherSalon} options={salons.map((p) => ({ label: `${p.name} · ${p.city}`, value: p.id }))} /> : null}
      {where === "adresse" ? (<><Field label="Adresse" value={addr} onChangeText={setAddr} placeholder="Rue, numéro, code postal, commune" maxLength={140} /><Select label="Ville" value={addrCity} onChange={setAddrCity} options={CITIES} /></>) : null}
      {dest?.kind === "salon" && dest.address ? <Muted>Livraison à : {dest.name}, {dest.address}</Muted> : null}

      <Label>À recevoir au plus tard le</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {[...(need && !needDays.includes(need) ? [need] : []), ...needDays].map((d) => <Chip key={d} label={shortDate(d)} active={need === d} onPress={() => setNeed(d)} />)}
      </ScrollView>
      {need ? <Muted>{frDate(need)}</Muted> : null}

      <Field label="Ton prénom" value={name} onChangeText={setName} maxLength={40} placeholder="ex. Aïcha" />
      <Field label="Note pour le livreur" value={note} onChangeText={setNote} multiline maxLength={300} placeholder="ex. À remettre à la coiffeuse" />
      <Muted>Tu paies directement le fournisseur avec le mode choisi. Kitoko ne prélève rien.</Muted>
      <ErrorText>{err}</ErrorText>
      <Btn title="Envoyer la commande" onPress={order} loading={busy} />
    </Screen>
  );
}
