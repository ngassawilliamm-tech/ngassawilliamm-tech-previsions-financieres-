import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";
import Constants from "expo-constants";

const extra = Constants?.expoConfig?.extra ?? {};
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra.supabaseAnonKey;

if (!url || !anonKey) {
  console.warn("Kitoko : EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY manquent dans le fichier .env");
}

export const supabase = createClient(url ?? "https://exemple.supabase.co", anonKey ?? "cle-manquante", {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

// Rafraîchit la session seulement quand l'app est au premier plan
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
