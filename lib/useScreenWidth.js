// Largeur de l'écran, compatible avec les pages du site générées à l'avance.
// Pendant la génération (et au tout premier affichage), on renvoie 0, comme le serveur,
// pour que la page générée et la page affichée soient identiques ; la vraie largeur
// arrive juste après. Sur l'app iPhone / Android, la vraie largeur est utilisée tout de suite.
import { useEffect, useState } from "react";
import { Platform, useWindowDimensions } from "react-native";

export function useHydrated() {
  const [ready, setReady] = useState(Platform.OS !== "web");
  useEffect(() => { setReady(true); }, []);
  return ready;
}

export function useScreenWidth() {
  const { width, height } = useWindowDimensions();
  const ready = useHydrated();
  return ready ? { width, height } : { width: 0, height: 0 };
}
