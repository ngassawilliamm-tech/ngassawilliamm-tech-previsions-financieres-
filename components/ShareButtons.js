// Boutons « Partager » et « WhatsApp » : pour que les clientes et les coiffeuses
// fassent circuler les pages Kitoko sur les réseaux.
import { useState } from "react";
import { Linking, Platform, Pressable, Share, Text } from "react-native";
import { Ionicons } from "../lib/icons";
import { useTheme, R } from "../lib/theme";
import { Row } from "./ui";
import { SITE_URL } from "../lib/seo";

export function ShareButtons({ path, text }) {
  const t = useTheme();
  const [copied, setCopied] = useState(false);
  const url = SITE_URL + path;
  const message = `${text} ${url}`;

  const share = async () => {
    try {
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({ title: "Kitoko", text, url });
          return;
        }
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        }
        return;
      }
      await Share.share({ message, url });
    } catch {
      // Partage annulé : rien à faire
    }
  };

  const whatsapp = () => Linking.openURL("https://wa.me/?text=" + encodeURIComponent(message));

  const btn = (label, icon, onPress, color, ink) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: R.pill, backgroundColor: color, opacity: pressed ? 0.85 : 1
      })}
    >
      <Ionicons name={icon} size={17} color={ink} />
      <Text style={{ color: ink, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );

  return (
    <Row>
      {btn(copied ? "Lien copié !" : "Partager", copied ? "checkmark" : "share-social-outline", share, t.chip, t.ink)}
      {btn("WhatsApp", "logo-whatsapp", whatsapp, "#25D366", "#0B3D20")}
    </Row>
  );
}
