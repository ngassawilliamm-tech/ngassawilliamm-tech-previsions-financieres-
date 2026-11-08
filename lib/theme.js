import { useColorScheme } from "react-native";

const light = { bg: "#FBF8F6", surface: "#FFFFFF", ink: "#22141C", muted: "#6E5B65", line: "#E9DFE3", accent: "#7B1E48", accentInk: "#FFFFFF", gold: "#B7790B", goldSoft: "#F6E9CF", ok: "#1F7A4D", okSoft: "#DDF1E6", chip: "#F3ECEF", danger: "#B3261E" };
const dark = { bg: "#17101A", surface: "#211824", ink: "#F5ECF0", muted: "#B9A6B0", line: "#3A2D3C", accent: "#E07AA6", accentInk: "#1A0E14", gold: "#E2B04F", goldSoft: "#3A2E17", ok: "#6FD3A0", okSoft: "#173528", chip: "#2E2231", danger: "#FF8A80" };

export function useTheme() {
  const scheme = useColorScheme();
  return scheme === "dark" ? { ...dark, dark: true } : { ...light, dark: false };
}
export const R = { sm: 8, md: 14, lg: 20, pill: 999 };
