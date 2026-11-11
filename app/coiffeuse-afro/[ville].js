// Page « Coiffeuse afro à <ville> » (une page par ville, générée pour Google)
import { useLocalSearchParams } from "expo-router";
import Landing from "../../components/Landing";
import { cityPage, content } from "../../lib/landing-content";

export function generateStaticParams() {
  return content.cities.map((c) => ({ ville: c.slug }));
}

export default function VillePage() {
  const { ville } = useLocalSearchParams();
  const page = cityPage(String(ville)) || cityPage("bruxelles");
  return <Landing {...page} filter={(p) => p.city === page.city} />;
}
