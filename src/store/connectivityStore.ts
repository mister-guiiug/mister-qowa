/**
 * Connectivité observée par les écrans temps réel, publiée pour le shell.
 *
 * POURQUOI UN STORE PLUTÔT QU'UN HOOK PARTAGÉ. Le bandeau hors-ligne vit au
 * niveau du shell (`App.tsx`), qui est dans le chunk initial ; `.info/connected`
 * vit dans le SDK Firebase, qui est délibérément chargé à la demande
 * (`firebase/env.ts` : « lit UNIQUEMENT import.meta.env, sans jamais importer le
 * SDK »). Brancher le shell directement sur `.info/connected` tirerait
 * `firebase/database` dans le chunk principal et ferait sauter le budget de
 * `scripts/check-bundle.mjs`.
 *
 * Ce store est le point de rendez-vous : aucune dépendance Firebase, écrit par
 * les écrans qui ont déjà payé le SDK (Host, Play), lu par le shell.
 *
 * `null` = INCONNU, et ce n'est pas `true` : personne n'observe le socket, donc
 * on ne prétend rien. Le shell retombe alors sur `navigator.onLine` seul.
 */
import { create } from "zustand";

interface ConnectivityState {
  /** Socket RTDB : `true` connecté, `false` coupé, `null` non observé. */
  rtdb: boolean | null;
  setRtdb: (v: boolean | null) => void;
}

export const useConnectivity = create<ConnectivityState>()((set) => ({
  rtdb: null,
  setRtdb: (rtdb) => set({ rtdb }),
}));
