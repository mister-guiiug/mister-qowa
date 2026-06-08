import { useEffect, useState } from "react";
import { ensureAuth } from "../firebase/app";

/** Garantit une session invité anonyme et expose l'uid (null tant que non prêt). */
export function useAuthUid(): string | null {
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    ensureAuth()
      .then((u) => {
        if (alive) setUid(u.uid);
      })
      .catch(() => {
        /* hors-ligne / config manquante : l'UI affichera l'état d'attente */
      });
    return () => {
      alive = false;
    };
  }, []);
  return uid;
}
