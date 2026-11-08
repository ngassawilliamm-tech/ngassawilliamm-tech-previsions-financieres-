// Kitoko : envoie les notifications push (Expo) quand un rendez-vous ou une commande change.
// Déclenchée par les « Database Webhooks » de Supabase sur les tables bookings et orders.
// Déploiement : npx supabase functions deploy notify --no-verify-jwt
// Secret requis : WEBHOOK_SECRET (le même que l'en-tête x-webhook-secret du webhook).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

type Payload = { type: "INSERT" | "UPDATE" | "DELETE"; table: string; record: any; old_record: any };

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" });

async function tokensFor(userIds: string[]): Promise<string[]> {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return [];
  const { data } = await supabase.from("push_tokens").select("token").in("user_id", ids);
  return (data ?? []).map((r) => r.token);
}
async function adminIds(): Promise<string[]> {
  const { data } = await supabase.from("admins").select("user_id");
  return (data ?? []).map((r) => r.user_id);
}
async function send(userIds: string[], title: string, body: string, data: Record<string, string>) {
  const tokens = await tokensFor(userIds);
  if (!tokens.length) return;
  const messages = tokens.map((to) => ({ to, title, body, data, sound: "default" }));
  for (let i = 0; i < messages.length; i += 100) {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages.slice(i, i + 100)),
    });
  }
}

Deno.serve(async (req) => {
  if (req.headers.get("x-webhook-secret") !== Deno.env.get("WEBHOOK_SECRET")) {
    return new Response("unauthorized", { status: 401 });
  }
  const p = (await req.json()) as Payload;
  const r = p.record, o = p.old_record;

  if (p.table === "bookings") {
    const { data: salon } = await supabase.from("salons").select("name, owner_id").eq("id", r.salon_id).single();
    if (!salon) return new Response("ok");
    const salonUsers = salon.owner_id ? [salon.owner_id] : await adminIds();
    const when = `${fmtDate(r.date)} à ${r.time}`;
    if (p.type === "INSERT") {
      await send(salonUsers, "Nouvelle demande de rendez-vous", `${r.first_name} : ${r.service}, ${when}`, { screen: "espace", bookingId: r.id });
    } else if (p.type === "UPDATE" && o && o.status !== r.status) {
      if (r.status === "confirme") await send([r.client_id], `${salon.name} a validé ton rendez-vous`, `${r.service}, ${when}${r.salon_message ? " · " + r.salon_message : ""}`, { screen: "espace", bookingId: r.id });
      if (r.status === "refuse") await send([r.client_id], `${salon.name} ne peut pas te prendre`, `${r.service}, ${when}${r.salon_message ? " · " + r.salon_message : ""}`, { screen: "espace", bookingId: r.id });
      if (r.status === "annule") await send(salonUsers, "Rendez-vous annulé", `${r.first_name} a annulé : ${r.service}, ${when}`, { screen: "espace", bookingId: r.id });
    }
  }

  if (p.table === "orders") {
    const { data: sup } = await supabase.from("suppliers").select("name, owner_id").eq("id", r.supplier_id).single();
    if (!sup) return new Response("ok");
    const qty = (r.lines ?? []).reduce((a: number, l: any) => a + (l.qty ?? 0), 0);
    if (p.type === "INSERT") {
      await send([sup.owner_id], "Nouvelle commande de mèches", `${r.buyer_name} : ${qty} paquets, avant le ${fmtDate(r.needed_by)}`, { screen: "espace", orderId: r.id });
      if (r.deliver_salon_id) {
        const { data: s } = await supabase.from("salons").select("owner_id").eq("id", r.deliver_salon_id).single();
        if (s?.owner_id && s.owner_id !== r.buyer_id) await send([s.owner_id], "Colis attendu au salon", `Mèches de ${r.buyer_name} (${sup.name}), avant le ${fmtDate(r.needed_by)}`, { screen: "espace", orderId: r.id });
      }
    } else if (p.type === "UPDATE" && o) {
      const labels: Record<string, string> = { acceptee: "acceptée", en_route: "en route", livree: "livrée", refusee: "refusée" };
      if (o.status !== r.status && labels[r.status]) await send([r.buyer_id], `Commande ${labels[r.status]}`, `${sup.name}${r.supplier_message ? " · " + r.supplier_message : ""}`, { screen: "espace", orderId: r.id });
      if (!o.paid && r.paid) await send([r.buyer_id], "Paiement reçu", `${sup.name} a bien reçu ton paiement.`, { screen: "espace", orderId: r.id });
      if (o.status !== r.status && r.status === "annulee") await send([sup.owner_id], "Commande annulée", `${r.buyer_name} a annulé sa commande.`, { screen: "espace", orderId: r.id });
    }
  }
  return new Response("ok");
});
