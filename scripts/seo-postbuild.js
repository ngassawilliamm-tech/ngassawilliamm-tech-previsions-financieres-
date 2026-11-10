// Après « expo export --platform web » : écrit le titre, la description, les mots-clés
// et l'aperçu de partage (Open Graph) directement dans chaque page HTML générée,
// pour que Google et WhatsApp/Facebook les lisent sans exécuter le site.
// Usage : node scripts/seo-postbuild.js [dossier]   (par défaut : dist)
const fs = require("fs");
const path = require("path");
const cfg = require("../lib/seo-pages.json");

const dir = path.resolve(process.argv[2] || "dist");
const KEYWORDS = [
  "tresses africaines", "box braids", "knotless braids", "cornrows", "nattes collées", "locks", "twists",
  "fulani braids", "coiffeuse afro", "salon afro", "coiffure afro", "tresses Bruxelles", "box braids Bruxelles",
  "coiffeuse afro Bruxelles", "salon afro Matonge", "tresses Liège", "tresses Anvers", "tresses Charleroi",
  "tresses Namur", "tresses Gand", "coiffeuse à domicile", "mèches", "mèches X-pression",
  "mèches livraison Belgique", "réserver coiffeuse afro", "coiffure afro Belgique"
].join(", ");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function routeOf(file) {
  let r = "/" + path.relative(dir, file).replace(/\\/g, "/").replace(/\.html$/, "");
  r = r.replace(/\/\([^/]+\)/g, ""); // groupes comme (tabs)
  if (r === "/index" || r === "") r = "/";
  return r.replace(/\/index$/, "");
}

function walk(d, out = []) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (f.endsWith(".html")) out.push(p);
  }
  return out;
}

// Données lues par Google : le site et l'organisation Kitoko
const jsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite", "@id": cfg.siteUrl + "/#site", url: cfg.siteUrl, name: "Kitoko", inLanguage: "fr-BE",
      description: cfg.pages["/"].description,
      potentialAction: { "@type": "SearchAction", target: cfg.siteUrl + "/coiffeuses?q={recherche}", "query-input": "required name=recherche" }
    },
    {
      "@type": "Organization", "@id": cfg.siteUrl + "/#org", name: "Kitoko", url: cfg.siteUrl,
      logo: cfg.siteUrl + "/logo-kitoko.png", slogan: "Beauté · Style · Confiance",
      areaServed: { "@type": "Country", name: "Belgique" },
      knowsAbout: ["Tresses africaines", "Box braids", "Knotless braids", "Cornrows", "Locks", "Twists", "Mèches"]
    }
  ]
}).replace(/</g, "\\u003c");
const common = [
  `<meta name="theme-color" content="#7B1E48"/>`,
  `<meta name="google" content="notranslate"/>`,
  `<link rel="apple-touch-icon" href="/logo-kitoko.png"/>`,
  `<script type="application/ld+json">${jsonLd}</script>`
].join("");

let n = 0;
for (const file of walk(dir)) {
  const route = routeOf(file);
  const page = cfg.pages[route];
  const noindex = cfg.noindex.includes(route) || !page;
  const title = page ? page.title : "Kitoko";
  const desc = page ? page.description : cfg.pages["/"].description;
  const url = cfg.siteUrl + (route === "/" ? "/" : route);
  const img = cfg.siteUrl + cfg.image;
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}"/>`,
    `<meta name="keywords" content="${esc(KEYWORDS)}"/>`,
    `<meta name="robots" content="${noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"}"/>`,
    route.includes("[") ? "" : `<link rel="canonical" href="${esc(url)}"/>`,
    `<meta property="og:type" content="website"/>`,
    `<meta property="og:site_name" content="Kitoko"/>`,
    `<meta property="og:locale" content="fr_BE"/>`,
    `<meta property="og:title" content="${esc(title)}"/>`,
    `<meta property="og:description" content="${esc(desc)}"/>`,
    route.includes("[") ? "" : `<meta property="og:url" content="${esc(url)}"/>`,
    `<meta property="og:image" content="${esc(img)}"/>`,
    `<meta property="og:image:width" content="1200"/>`,
    `<meta property="og:image:height" content="630"/>`,
    `<meta name="twitter:card" content="summary_large_image"/>`,
    `<meta name="twitter:title" content="${esc(title)}"/>`,
    `<meta name="twitter:description" content="${esc(desc)}"/>`,
    `<meta name="twitter:image" content="${esc(img)}"/>`
  ].filter(Boolean).join("");
  let html = fs.readFileSync(file, "utf8");
  html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/, "").replace(/<meta name="description"[^>]*>/, "");
  html = html.replace("<head>", "<head>" + tags + common);
  html = html.replace(/<html([^>]*)\slang="[^"]*"/, "<html$1").replace("<html", '<html lang="fr-BE"');
  fs.writeFileSync(file, html);
  n++;
}
console.log(`Référencement : ${n} pages mises à jour dans ${dir}`);
