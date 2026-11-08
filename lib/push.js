import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true }),
});

// Demande l'autorisation et enregistre le jeton du téléphone pour l'utilisateur connecté.
export async function registerForPush(userId) {
  try {
    if (!userId || !Device.isDevice) return null;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", { name: "Kitoko", importance: Notifications.AndroidImportance.HIGH, lightColor: "#7B1E48" });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== "granted") return null;
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId || projectId.startsWith("A_REMPLIR")) { console.warn("Kitoko : lance « eas init » pour activer les notifications push."); return null; }
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await supabase.from("push_tokens").upsert({ token, user_id: userId, platform: Platform.OS, updated_at: new Date().toISOString() });
    return token;
  } catch (e) {
    console.warn("Kitoko : notifications indisponibles", e?.message);
    return null;
  }
}
