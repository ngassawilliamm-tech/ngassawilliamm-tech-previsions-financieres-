// Textes des pages « Coiffeuse afro à <ville> » et « <coiffure> en Belgique ».
// Utilisé par l'app/le site ET par scripts/seo-postbuild.js (titres, descriptions,
// FAQ pour Google) : écrit en CommonJS pour fonctionner dans les deux cas.
const content = require("./seo-content.json");

const cityBySlug = Object.fromEntries(content.cities.map((c) => [c.slug, c]));
const styleBySlug = Object.fromEntries(content.styles.map((s) => [s.slug, s]));
const popularCities = content.popular.map((name) => content.cities.find((c) => c.name === name)).filter(Boolean);

function cityPage(slug) {
  const city = cityBySlug[slug];
  if (!city) return null;
  const v = city.name;
  const path = `/coiffeuse-afro/${slug}`;
  return {
    kind: "ville",
    path,
    city: v,
    title: `Coiffeuse afro à ${v} – tresses, box braids, knotless | Kitoko`,
    description: `Trouve une coiffeuse afro à ${v} : box braids, knotless, cornrows, Fulani braids, locks, twists. En salon ou à domicile, avis des clientes et réservation en ligne sur Kitoko.`,
    eyebrow: `Coiffure afro · ${v}`,
    h1: `Coiffeuses afro et tresses à ${v}`,
    intro: `Tu cherches une coiffeuse pour tes box braids, knotless, cornrows ou locks à ${v} ? Kitoko réunit les salons afro, les coiffeuses à domicile et celles qui reçoivent chez elles. Compare les styles et les avis, réserve ta séance et fais livrer tes mèches directement au salon.`,
    paragraphs: [
      {
        title: `Trouver la bonne coiffeuse à ${v}`,
        text: `Chaque coiffeuse présente sur Kitoko indique les coiffures qu'elle maîtrise, son mode de travail (en salon, à domicile ou chez elle) et son prix de départ. Les avis laissés par les clientes après leur rendez-vous t'aident à choisir en toute confiance.`
      },
      {
        title: `Tes mèches livrées au salon`,
        text: `Plus besoin de courir les boutiques avant ta séance : commande tes mèches X-pression, Kanekalon ou afro kinky sur Kitoko et fais-les livrer au salon de ton rendez-vous à ${v}.`
      }
    ],
    faq: [
      { q: `Comment réserver une coiffeuse afro à ${v} ?`, a: `Choisis une coiffeuse dans la liste, sélectionne ta coiffure, ta date et ton heure, puis envoie ta demande. La coiffeuse la confirme dans son espace Kitoko et tu reçois une notification.` },
      { q: `Y a-t-il des coiffeuses afro à domicile à ${v} ?`, a: `Oui. Dans la liste des coiffeuses, utilise le filtre « À domicile » pour voir celles qui se déplacent à ${v} et dans les environs.` },
      { q: `Combien coûtent des box braids à ${v} ?`, a: `Le prix dépend de la longueur, de l'épaisseur des tresses et des mèches choisies. Chaque coiffeuse affiche son tarif de départ sur sa fiche Kitoko, et tu peux la contacter pour un prix précis.` },
      { q: `Puis-je faire livrer mes mèches au salon ?`, a: `Oui. Dans la rubrique Mèches, choisis une boutique qui livre à ${v} et indique le salon de ton rendez-vous comme adresse de livraison.` }
    ],
    searchParams: { ville: v },
    emptyText: `Les premières coiffeuses de ${v} arrivent bientôt sur Kitoko.`,
    shareText: `Trouve ta coiffeuse afro à ${v} sur Kitoko :`,
    linksTitle: `Coiffures populaires à ${v}`,
    links: content.styles.map((s) => ({ href: `/coiffure/${s.slug}`, label: s.name })),
    links2Title: "Autres villes",
    links2: popularCities.filter((c) => c.slug !== slug).map((c) => ({ href: `/coiffeuse-afro/${c.slug}`, label: c.name })),
    crumbs: [{ label: "Accueil", href: "/" }, { label: "Coiffeuses", href: "/coiffeuses" }, { label: v }]
  };
}

function stylePage(slug) {
  const s = styleBySlug[slug];
  if (!s) return null;
  const path = `/coiffure/${slug}`;
  return {
    kind: "style",
    path,
    style: s.style,
    title: `${s.name} en Belgique – coiffeuses et salons afro | Kitoko`,
    description: `${s.name} à Bruxelles, Liège, Anvers, Charleroi et partout en Belgique : trouve une coiffeuse spécialisée, consulte les avis et réserve en ligne sur Kitoko.`,
    eyebrow: "Coiffure afro en Belgique",
    h1: `${s.name} en Belgique`,
    intro: s.intro,
    paragraphs: [
      {
        title: `Où faire des ${s.name.toLowerCase()} ?`,
        text: `Kitoko référence des coiffeuses à Bruxelles, Liège, Anvers, Charleroi, Namur, Gand et dans des dizaines d'autres villes belges. Choisis ta ville pour voir celles qui proposent ce style près de chez toi.`
      },
      {
        title: "Préparer ta séance",
        text: `Commande à l'avance les mèches conseillées par ta coiffeuse et fais-les livrer au salon : ta séance commence à l'heure, sans détour par la boutique.`
      }
    ],
    faq: [
      { q: `Combien de temps durent des ${s.name.toLowerCase()} ?`, a: `Cela dépend de la technique et de l'entretien. Ta coiffeuse t'indique la durée conseillée et les soins à prévoir pour garder ta coiffure belle le plus longtemps possible.` },
      { q: `Comment trouver une coiffeuse pour des ${s.name.toLowerCase()} près de chez moi ?`, a: `Choisis ta ville ci-dessous ou utilise la recherche Kitoko avec le filtre « ${s.style} » pour voir les coiffeuses disponibles près de chez toi.` },
      { q: `Faut-il apporter ses mèches ?`, a: `Demande à ta coiffeuse lesquelles elle conseille. Tu peux ensuite les commander sur Kitoko et les faire livrer directement au salon avant ton rendez-vous.` }
    ],
    searchParams: { style: s.style },
    emptyText: `Les premières coiffeuses proposant ce style arrivent bientôt sur Kitoko.`,
    shareText: `${s.name} : trouve ta coiffeuse sur Kitoko`,
    linksTitle: `${s.name} dans ta ville`,
    links: popularCities.map((c) => ({ href: `/coiffeuse-afro/${c.slug}`, label: `${c.name}` })),
    links2Title: "Autres coiffures",
    links2: content.styles.filter((x) => x.slug !== slug).map((x) => ({ href: `/coiffure/${x.slug}`, label: x.name })),
    crumbs: [{ label: "Accueil", href: "/" }, { label: "Coiffures", href: "/coiffeuses" }, { label: s.name }]
  };
}

module.exports = { content, cityPage, stylePage, popularCities };
