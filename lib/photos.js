// Vraies photos de l'accueil : galerie qui défile (avec zoom lent) et petits visages du haut.
//
// Pour ajouter une photo :
// 1. Mets-la dans le dossier assets/photos (format vertical, environ 600 px de large)
// 2. Ajoute une ligne ci-dessous.
//
// `style` doit correspondre à un style de la liste STYLES (lib/constants.js) :
// toucher la photo ouvre les coiffeuses de ce style.
//
// Si la liste est vide, l'accueil affiche les portraits illustrés.
export const PHOTOS = [
  { source: require("../assets/photos/femme-tresses-dorees.jpg"), label: "Tresses dorées", style: "Tresses" },
  { source: require("../assets/photos/femme-box-braids.jpg"), label: "Box braids", style: "Box braids" },
  { source: require("../assets/photos/femme-fulani-braids.jpg"), label: "Fulani braids", style: "Tresses" },
  { source: require("../assets/photos/femme-chignon-tresse.jpg"), label: "Chignon tressé", style: "Cornrows / nattes collées" },
  { source: require("../assets/photos/femme-cornrows.jpg"), label: "Cornrows", style: "Cornrows / nattes collées" },
  { source: require("../assets/photos/femme-passion-twists.jpg"), label: "Passion twists", style: "Twists" },
  { source: require("../assets/photos/femme-queue-tressee.jpg"), label: "Queue tressée", style: "Tresses" },
  { source: require("../assets/photos/femme-twists.jpg"), label: "Twists sénégalaises", style: "Twists" },
  { source: require("../assets/photos/femme-bob-braids.jpg"), label: "Bob braids", style: "Box braids" },
  { source: require("../assets/photos/femme-boho-braids.jpg"), label: "Boho braids", style: "Knotless" }
];
