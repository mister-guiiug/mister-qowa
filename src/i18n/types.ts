/** Types partagés i18n (isolés pour éviter un cycle d'import fr ↔ index). */
export type Vars = Record<string, string | number>;
export type Msg = string | ((v: Vars) => string);
