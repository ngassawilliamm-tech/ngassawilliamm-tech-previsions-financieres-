// Icônes Ionicons compatibles avec les pages du site générées à l'avance :
// pendant la génération, la police des icônes n'existe pas encore, donc on réserve
// seulement la place de l'icône ; elle s'affiche dès l'ouverture de la page.
// Sur l'app iPhone / Android, l'icône s'affiche tout de suite.
import { View } from "react-native";
import { Ionicons as RealIonicons } from "@expo/vector-icons";
import { useHydrated } from "./useScreenWidth";

export function Ionicons(props) {
  const ready = useHydrated();
  if (!ready) return <View style={[{ width: props.size ?? 12, height: props.size ?? 12 }, props.style]} />;
  return <RealIonicons {...props} />;
}
