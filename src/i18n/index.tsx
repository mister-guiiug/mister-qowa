/**
 * i18n maison ultra-légère (zéro dépendance, ~1 KB) : un dictionnaire plat par
 * langue, des valeurs `string` (avec interpolation `{var}`) ou `fonction` (pour
 * les pluriels). La parité des clés FR/EN est garantie par le typage (`en`
 * `satisfies Record<Key, Msg>` impose toutes les clés de `fr`).
 *
 * Défaut = FRANÇAIS (contenu et public francophones ; e2e déterministes).
 * Ajouter une langue = un seul fichier dico + une entrée dans `DICTS`/`LANGS`.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fr, type Key } from "./fr";
import { en } from "./en";
import type { Vars, Msg } from "./types";

export type { Key } from "./fr";
export type { Vars, Msg } from "./types";

export type Lang = "fr" | "en";

const DICTS: Record<Lang, Record<Key, Msg>> = { fr, en };

/** Langues proposées dans le sélecteur (drapeau + libellé). */
export const LANGS: { code: Lang; flag: string; label: string }[] = [
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "en", flag: "🇬🇧", label: "English" },
];

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLang = create<LangState>()(
  persist(
    (set) => ({
      lang: "fr",
      setLang: (lang) => set({ lang }),
    }),
    { name: "mister-qowa:lang", version: 1 },
  ),
);

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}

export type TFn = (key: Key, vars?: Vars) => string;

/** Hook de traduction : `const t = useT(); t("home.host")`. */
export function useT(): TFn {
  const lang = useLang((s) => s.lang);
  const dict = DICTS[lang];
  return (key, vars) => {
    const m = dict[key];
    return typeof m === "function" ? m(vars ?? {}) : interpolate(m, vars);
  };
}
