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
      .catch((e) => {
        // Hors-ligne / config manquante : l'UI affiche l'état d'attente, mais on
        // ne l'avale plus silencieusement (diagnostic d'une auth qui ne part pas).
        console.error("[auth] session invité indisponible", e);
      });
    return () => {
      alive = false;
    };
  }, []);
  return uid;
}
