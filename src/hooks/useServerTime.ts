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

export const serverNow = (offset: number): number => Date.now() + offset;
