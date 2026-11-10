import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";
import Constants from "expo-constants";

const extra = Constants?.expoConfig?.extra ?? {};
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra.supabaseAnonKey;

if (!url || !anonKey) {
  console.warn("Kitoko : EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY manquent dans le fichier .env");
}

// Pendant la génération des pages du site (sur le serveur, sans navigateur),
// il n'y a ni « window » ni stockage : on n'utilise pas de session à ce moment-là.
const isServer = Platform.OS === "web" && typeof window === "undefined";

export const supabase = createClient(url ?? "https://exemple.supabase.co", anonKey ?? "cle-manquante", {
  auth: isServer
    ? { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    : { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

// Rafraîchit la session seulement quand l'app est au premier plan
if (!isServer) {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
