/**
 * i18n maison ultra-légère (zéro dépendance) : un dictionnaire plat par langue,
 * valeurs `string` (interpolation `{var}`) ou `fonction` (pluriels/ordinaux).
 * La parité des clés est garantie par le typage (`en/es/de/it`
 * `satisfies Record<Key, Msg>` impose toutes les clés de `fr`).
 *
 * Défaut = FRANÇAIS (bundlé). Les autres langues sont chargées À LA DEMANDE
 * (`import()`), donc le chunk d'entrée ne porte que le dico FR. Le dico actif
 * vit dans le store ; le sélecteur déclenche le chargement puis l'applique.
 * Ajouter une langue = 1 fichier dico + 1 entrée dans `LOADERS`/`LANGS`.
 */
import { useCallback } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fr, type Key } from "./fr";
import type { Vars, Msg } from "./types";
import { AppError } from "../lib/appError";

export type { Key } from "./fr";
export type { Vars, Msg } from "./types";

export type Lang = "fr" | "en" | "es" | "de" | "it";

type Dict = Record<Key, Msg>;

/** Chargeurs paresseux : FR est synchrone (bundlé), le reste en chunk séparé. */
const LOADERS: Record<Lang, () => Promise<Dict>> = {
  fr: () => Promise.resolve(fr),
  en: () => import("./en").then((m) => m.en),
  es: () => import("./es").then((m) => m.es),
  de: () => import("./de").then((m) => m.de),
  it: () => import("./it").then((m) => m.it),
};

/** Langues proposées dans le sélecteur (drapeau + libellé). */
export const LANGS: { code: Lang; flag: string; label: string }[] = [
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
  { code: "it", flag: "🇮🇹", label: "Italiano" },
];

interface LangState {
  lang: Lang;
  /** Dico actif (chargé) — `fr` tant qu'une autre langue n'est pas prête. */
  dict: Dict;
  setLang: (lang: Lang) => void;
}

export const useLang = create<LangState>()(
  persist(
    (set, get) => ({
      lang: "fr",
      dict: fr,
      setLang: (lang) => {
        if (lang === get().lang) return;
        // Charge le dico AVANT de basculer (lang + dict ensemble = pas de FOUC).
        void LOADERS[lang]().then((dict) => set({ lang, dict }));
      },
    }),
    {
      name: "mister-qowa:lang",
      version: 1,
      // Ne persiste que la langue (jamais le dico, volumineux).
      partialize: (s) => ({ lang: s.lang }),
      // Au rechargement : si la langue mémorisée n'est pas FR, charge son dico.
      onRehydrateStorage: () => (state) => {
        if (state && state.lang !== "fr") {
          void LOADERS[state.lang]().then((dict) => useLang.setState({ dict }));
        }
      },
    },
  ),
);

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}

export type TFn = (key: Key, vars?: Vars) => string;

function render(dict: Dict, key: Key, vars?: Vars): string {
  const m = dict[key];
  return typeof m === "function" ? m(vars ?? {}) : interpolate(m, vars);
}

/** Hook de traduction : `const t = useT(); t("home.host")`. */
export function useT(): TFn {
  const dict = useLang((s) => s.dict);
  // Référence stable tant que la langue ne change pas : les consommateurs
  // peuvent déclarer `t` (ou `err`) en dépendance d'un effet sans boucler.
  return useCallback<TFn>((key, vars) => render(dict, key, vars), [dict]);
}

/** Traduction HORS React (ErrorBoundary…) — lit le dico actif du store. */
export function tStatic(key: Key, vars?: Vars): string {
  return render(useLang.getState().dict, key, vars);
}

/** Hook d'affichage d'erreur : traduit une AppError, sinon message brut. */
export function useErr(): (e: unknown) => string {
  const t = useT();
  return useCallback(
    (e: unknown) => {
      if (e instanceof AppError) return t(e.key, e.vars);
      if (e instanceof Error) return e.message;
      if (typeof e === "string") return e;
      return t("err.generic");
    },
    [t]
  );
}
