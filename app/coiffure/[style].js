// Page « <coiffure> en Belgique » (une page par coiffure, générée pour Google)
import { useLocalSearchParams } from "expo-router";
import Landing from "../../components/Landing";
import { stylePage, content } from "../../lib/landing-content";

export function generateStaticParams() {
  return content.styles.map((s) => ({ style: s.slug }));
}

export default function StylePage() {
  const { style } = useLocalSearchParams();
  const page = stylePage(String(style)) || stylePage("box-braids");
  return <Landing {...page} filter={(p) => (p.styles || []).includes(page.style)} />;
}
