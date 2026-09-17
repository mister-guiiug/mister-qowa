/**
 * Rend les DEUX images à fond perdu depuis `public/icons/icon-maskable.svg` :
 * le maskable Android (512) et l'icône d'accueil iOS (180).
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
 * ET POURQUOI L'ICÔNE APPLE EST ICI, ET PLUS DANS `npm run icons`. Le même
 * défaut la frappe, sans qu'on ait rien demandé : `pwa-icons` écrit
 * `apple-touch-icon.png` PAR DÉFAUT, `--maskable` ou pas. iOS n'accepte pas la
 * transparence et APLATIT les coins de la tuile arrondie sur une couleur — celle
 * de `--bg`, dont le défaut vaut `12,18,34`, un bleu nuit qui n'a rien à voir
 * avec le violet d'ici.
 *
 * Le fichier livré jusqu'au 14/09/2026 ne venait même pas de là : 192 px, coins
 * à `0,0,0` quand le bord rendait `111,50,214`. Du NOIR autour d'une tuile
 * violette, hérité d'un générateur antérieur. La prochaine exécution de
 * `npm run icons` l'aurait remplacé par le bleu nuit — un intrus pour un autre.
 *
 * Le fond étant un DÉGRADÉ (`#7c3aed` → `#4c1d95`), aucune valeur de `--bg` ne
 * peut convenir : un aplat unique ne coïncide pas avec deux coins de teintes
 * différentes. La source à fond perdu, elle, n'a aucun coin à aplatir. D'où
 * `--no-apple` dans le script `icons`.
 *
 * Exécuter : npm run icons:maskable
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');

// `density` : sans elle, sharp pixellise le SVG à 72 ppp AVANT de
// redimensionner, et le dégradé en ressort bandé.
const rend = (taille, nom) =>
  sharp(join(racine, 'public', 'icons', 'icon-maskable.svg'), {
    density: 384,
  })
    .resize(taille, taille)
    .png()
    .toFile(join(racine, 'public', 'icons', nom));

await rend(512, 'icon-maskable.png');
await rend(180, 'apple-touch-icon.png');

console.log(
  'public/icons/icon-maskable.png (512×512) et public/icons/apple-touch-icon.png (180×180) écrits, à fond perdu.'
);
