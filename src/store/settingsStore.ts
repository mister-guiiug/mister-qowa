/**
 * Réglages locaux de génération IA (BYOK — « bring your own key »).
 * La clé API reste dans le navigateur (localStorage) : aucun serveur Mister Qowa
 * ne la voit, les appels partent en direct vers le fournisseur choisi.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AiProvider = "gemini" | "anthropic";

/** Modèle par défaut par fournisseur (surchageable). */
export const DEFAULT_MODELS: Record<AiProvider, string> = {
  gemini: "gemini-2.0-flash",
  anthropic: "claude-3-5-haiku-latest",
};

/** Lien « où récupérer une clé » par fournisseur (affiché dans l'UI). */
export const KEY_HELP: Record<AiProvider, { label: string; url: string }> = {
  gemini: {
    label: "Google AI Studio",
    url: "https://aistudio.google.com/apikey",
  },
  anthropic: {
    label: "Console Anthropic",
    url: "https://console.anthropic.com/settings/keys",
  },
};

interface AiSettings {
  provider: AiProvider;
  /** Clé par fournisseur : changer de fournisseur ne perd pas l'autre clé. */
  keys: Partial<Record<AiProvider, string>>;
  /** Modèle par fournisseur (vide = défaut). */
  models: Partial<Record<AiProvider, string>>;
  setProvider: (p: AiProvider) => void;
  setKey: (p: AiProvider, key: string) => void;
  setModel: (p: AiProvider, model: string) => void;
}

export const useAiSettings = create<AiSettings>()(
  persist(
    (set) => ({
      provider: "gemini",
      keys: {},
      models: {},
      setProvider: (provider) => set({ provider }),
      setKey: (p, key) => set((s) => ({ keys: { ...s.keys, [p]: key } })),
      setModel: (p, model) =>
        set((s) => ({ models: { ...s.models, [p]: model } })),
    }),
    {
      name: "mister-qowa:ai-settings",
      version: 1,
      migrate: (persisted) => persisted as AiSettings,
    },
  ),
);

/** Modèle effectif pour un fournisseur (réglage utilisateur ou défaut). */
export function effectiveModel(
  provider: AiProvider,
  models: Partial<Record<AiProvider, string>>,
): string {
  return models[provider]?.trim() || DEFAULT_MODELS[provider];
}
