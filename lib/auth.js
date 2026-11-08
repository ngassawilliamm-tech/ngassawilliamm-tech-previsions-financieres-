import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [mySalon, setMySalon] = useState(null);
  const [mySupplier, setMySupplier] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshRoles = useCallback(async () => {
    const uid = session?.user?.id;
    if (!uid) { setMySalon(null); setMySupplier(null); setIsAdmin(false); setProfile(null); return; }
    const [s, f, a, p] = await Promise.all([
      supabase.from("salons").select("*").eq("owner_id", uid).maybeSingle(),
      supabase.from("suppliers").select("*").eq("owner_id", uid).maybeSingle(),
      supabase.from("admins").select("user_id").eq("user_id", uid).maybeSingle(),
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
    ]);
    setMySalon(s.data ?? null); setMySupplier(f.data ?? null); setIsAdmin(!!a.data); setProfile(p.data ?? null);
  }, [session?.user?.id]);

  useEffect(() => { refreshRoles(); }, [refreshRoles]);

  const value = { session, user: session?.user ?? null, ready, mySalon, mySupplier, isAdmin, profile, refreshRoles,
    signOut: () => supabase.auth.signOut() };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);
