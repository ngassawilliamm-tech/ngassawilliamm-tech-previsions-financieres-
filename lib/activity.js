import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./auth";
import { todayStr } from "./constants";

// Compte ce qui attend une action dans « Mon espace » (pastille sur l'onglet) et se met à jour en direct.
const ActivityCtx = createContext({ pending: 0, version: 0, refresh: () => {} });

export function ActivityProvider({ children }) {
  const { user, mySalon, mySupplier, isAdmin } = useAuth();
  const [pending, setPending] = useState(0);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) { setPending(0); return; }
    let n = 0; const t = todayStr();
    if (mySalon || isAdmin) {
      const { count } = await supabase.from("bookings").select("id", { count: "exact", head: true }).eq("status", "attente").gte("date", t);
      n += count ?? 0;   // les règles RLS ne renvoient que les rendez-vous de mon salon (ou des salons gérés par l'équipe)
    }
    if (mySupplier) {
      const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("supplier_id", mySupplier.id).eq("status", "envoyee");
      n += count ?? 0;
    }
    setPending(n); setVersion((v) => v + 1);
  }, [user?.id, mySalon?.id, mySupplier?.id, isAdmin]);

  useEffect(() => {
    refresh();
    if (!user) return;
    const ch = supabase.channel("kitoko-activite")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refresh, user?.id]);

  return <ActivityCtx.Provider value={{ pending, version, refresh }}>{children}</ActivityCtx.Provider>;
}
export const useActivity = () => useContext(ActivityCtx);
