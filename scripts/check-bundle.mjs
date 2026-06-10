/**
 * Budget de taille du bundle — échoue si le chunk applicatif principal dépasse
 * le plafond. Lancé en fin de `npm run build` (donc aussi en CI / déploiement).
 * Recalibrer le plafond consciemment lors d'un ajout de dépendance assumé.
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ASSETS = "dist/assets";
const MAIN_CHUNK_BUDGET_KB = 300; // app-*.js : 253 KB mesurés (LazyMotion + Firestore lazy)

const files = readdirSync(ASSETS).filter((f) => f.endsWith(".js"));
const main = files.find((f) => /^app-.*\.js$/.test(f));
if (!main) {
  console.error(`[bundle] chunk principal app-*.js introuvable dans ${ASSETS}`);
  process.exit(1);
}
const sizeKb = Math.round(statSync(join(ASSETS, main)).size / 1024);
if (sizeKb > MAIN_CHUNK_BUDGET_KB) {
  console.error(
    `[bundle] ${main} fait ${sizeKb} KB > budget ${MAIN_CHUNK_BUDGET_KB} KB — ` +
      "ajuste le code (lazy import ?) ou recalibre consciemment le budget.",
  );
  process.exit(1);
}
console.log(`[bundle] ${main} : ${sizeKb} KB ≤ ${MAIN_CHUNK_BUDGET_KB} KB ✓`);
