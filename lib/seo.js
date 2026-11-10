// Référencement (Google, partages WhatsApp / Facebook / Instagram).
//
// L'adresse définitive du site est dans lib/seo-pages.json (« siteUrl »). Si le nom de
// domaine change, la modifier là, ainsi que dans public/robots.txt et public/sitemap.xml.
import Head from "expo-router/head";

import pages from "./seo-pages.json";

// Adresse définie dans lib/seo-pages.json (utilisée aussi par scripts/seo-postbuild.js)
export const SITE_URL = pages.siteUrl;
export const SITE_NAME = "Kitoko";

// Mots-clés les plus recherchés en Belgique pour la coiffure afro et les tresses
export const KEYWORDS = [
  "tresses africaines", "box braids", "knotless braids", "cornrows", "nattes collées",
  "locks", "twists", "fulani braids", "coiffeuse afro", "salon afro", "coiffure afro",
  "tresses Bruxelles", "box braids Bruxelles", "coiffeuse afro Bruxelles", "salon afro Matonge",
  "tresses Liège", "tresses Anvers", "tresses Charleroi", "tresses Namur", "tresses Gand",
  "coiffeuse à domicile", "mèches", "mèches X-pression", "mèches livraison Belgique",
  "réserver coiffeuse afro", "coiffure afro Belgique"
].join(", ");

export const DEFAULT_TITLE = "Kitoko – Tresses africaines, box braids et coiffeuses afro en Belgique";
export const DEFAULT_DESCRIPTION =
  "Trouve et réserve ta coiffeuse afro à Bruxelles, Liège, Anvers, Charleroi et dans 67 villes de Belgique : box braids, knotless, cornrows, locks, twists. Fais livrer tes mèches au salon avant ta séance.";
export const OG_IMAGE = "/og-image.jpg";

// Titre de l'onglet quand on navigue dans le site. Les autres balises (description,
// mots-clés, aperçu de partage) sont écrites dans les pages HTML par
// scripts/seo-postbuild.js, pour que Google les lise directement.
export function Seo({ title, noindex }) {
  const fullTitle = title ? `${title} | Kitoko` : DEFAULT_TITLE;
  return (
    <Head>
      <title>{fullTitle}</title>
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : null}
    </Head>
  );
}
