/**
 * Flags d'environnement Firebase — lit UNIQUEMENT `import.meta.env`, sans jamais
 * importer le SDK Firebase. Importable depuis l'entrée (App.tsx) sans tirer
 * `firebase/*` dans le chunk initial (le SDK reste chargé à la demande via app.ts).
 */
export const useEmulator = import.meta.env.VITE_USE_EMULATOR === "1";

/**
 * App Check OBLIGATOIRE ? Opt-in via `VITE_REQUIRE_APPCHECK="true"` (prod, hors
 * émulateur). Tant qu'App Check n'est pas provisionné (console + secret de
 * déploiement), laisser à false : sinon un build prod sans clé bloquerait tout.
 */
const requireAppCheck =
  !useEmulator &&
  import.meta.env.PROD &&
  import.meta.env.VITE_REQUIRE_APPCHECK === "true";

/**
 * Configuration exploitable, évaluée AU RENDU (App.tsx) sans initialiser
 * Firebase : si App Check est requis mais que la clé manque, on refuse de
 * démarrer le jeu plutôt que de tourner sans protection anti-bot.
 */
export function isConfigOk(): boolean {
  if (requireAppCheck && !import.meta.env.VITE_FIREBASE_APPCHECK_KEY) {
    return false;
  }
  return true;
}
