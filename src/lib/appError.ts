/**
 * Erreur applicative PORTEUSE d'une clé i18n : levée dans les couches métier
 * (api, ai, validation…) puis traduite au point d'affichage via `useErr()`.
 * Garde le message brut (= la clé) comme fallback hors contexte traduit.
 */
import type { Key, Vars } from "../i18n";

export class AppError extends Error {
  key: Key;
  vars?: Vars;
  constructor(key: Key, vars?: Vars) {
    super(key);
    this.name = "AppError";
    this.key = key;
    this.vars = vars;
  }
}
