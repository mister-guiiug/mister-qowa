/** Profil joueur persistant (local-first, localStorage). Voir lib/profile.ts. */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type Profile,
  type GameResult,
  emptyProfile,
  applyGameResult,
} from "../lib/profile";

interface ProfileState {
  profile: Profile;
  /** Mémorise pseudo + avatar pour pré-remplir Join à la prochaine partie. */
  setIdentity: (pseudo: string, avatar: string) => void;
  /** Comptabilise une partie terminée (idempotent par sessionId). */
  recordGame: (r: GameResult) => void;
}

export const useProfile = create<ProfileState>()(
  persist(
    (set) => ({
      profile: emptyProfile(),
      setIdentity: (pseudo, avatar) =>
        set((s) => ({ profile: { ...s.profile, pseudo, avatar } })),
      recordGame: (r) =>
        set((s) => ({ profile: applyGameResult(s.profile, r) })),
    }),
    {
      name: "mister-qowa:profile",
      version: 1,
      migrate: (persisted) => persisted as ProfileState,
    },
  ),
);
