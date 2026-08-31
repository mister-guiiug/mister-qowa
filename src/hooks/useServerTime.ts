import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { getDb } from "../firebase/app";
import { useConnectivity } from "../store/connectivityStore";

/** Décalage horloge locale ↔ serveur RTDB (ms). Pour un compte à rebours juste. */
export function useServerOffset(): number {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const off = onValue(ref(getDb(), ".info/serverTimeOffset"), (snap) => {
      const v = snap.val();
      if (typeof v === "number") setOffset(v);
    });
    return () => off();
  }, []);
  return offset;
}

/**
 * Observe le socket RTDB (`.info/connected`, pseudo-nœud natif, gratuit en
 * Spark) et PUBLIE son état dans le store de connectivité, que le bandeau du
 * shell consomme sans jamais importer Firebase.
 *
 * À monter par les écrans temps réel (Host, Play) — eux seuls ont déjà chargé le
 * SDK. Au démontage on repasse à `null` (inconnu) : un `false` figé ferait
 * mentir le bandeau sur l'accueil, où plus personne n'observe le socket.
 *
 * On ne publie rien avant le premier instantané : le bandeau retombe alors sur
 * `navigator.onLine`, ce qui évite un faux « hors ligne » au tout premier rendu
 * — la précaution que prenait déjà l'état local `true` d'avant.
 */
export function useRtdbPresence(): void {
  const setRtdb = useConnectivity((s) => s.setRtdb);
  useEffect(() => {
    const off = onValue(ref(getDb(), ".info/connected"), (snap) => {
      setRtdb(snap.val() === true);
    });
    return () => {
      off();
      setRtdb(null);
    };
  }, [setRtdb]);
}

export const serverNow = (offset: number): number => Date.now() + offset;
