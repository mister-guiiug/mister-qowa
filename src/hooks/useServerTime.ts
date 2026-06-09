import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { getDb } from "../firebase/app";

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
 * État de connexion socket RTDB (`.info/connected`, pseudo-nœud natif, gratuit
 * en Spark). `true` tant qu'on n'a pas eu de signal contraire pour éviter un
 * faux « hors ligne » au tout premier rendu.
 */
export function useConnectionState(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const off = onValue(ref(getDb(), ".info/connected"), (snap) => {
      setOnline(snap.val() === true);
    });
    return () => off();
  }, []);
  return online;
}

export const serverNow = (offset: number): number => Date.now() + offset;
