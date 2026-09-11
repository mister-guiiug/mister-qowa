/**
 * Rend l'icône maskable en PNG depuis `public/icons/icon-maskable.svg`.
 *
 * POURQUOI UN SVG À PART, ET PAS LE MODE MASKABLE DU GÉNÉRATEUR. Celui-ci
 * fabrique un maskable en RÉDUISANT la source dans la zone de sécurité, sur un
 * aplat. Quand la source est une tuile arrondie — c'est le cas ici — le résultat
 * est cette tuile posée au milieu de l'aplat, et le raccord se voit : Android en
 * fait un liseré tout autour de l'icône. Choisir la couleur de l'aplat rapproche
 * les deux teintes, ça ne supprime jamais le raccord.
 *
 * Un maskable se DESSINE à fond perdu. `icon-maskable.svg` reprend le même
 * dégradé et le même dessin que `icon.svg`, sans les coins arrondis. Le
 * commentaire du SVG dit ce qui en diffère, et pourquoi.
 *
 * Exécuter : npm run icons:maskable
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");

// `density` : sans elle, sharp pixellise le SVG à 72 ppp AVANT de
// redimensionner, et le dégradé en ressort bandé.
await sharp(join(racine, "public", "icons", "icon-maskable.svg"), {
  density: 384,
})
  .resize(512, 512)
  .png()
  .toFile(join(racine, "public", "icons", "icon-maskable.png"));

console.log("public/icons/icon-maskable.png écrit (512×512, à fond perdu).");
