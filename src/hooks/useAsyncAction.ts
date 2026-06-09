import { useCallback, useState } from "react";
import { errMsg } from "../lib/err";

/**
 * Gestion factorisée d'une action asynchrone : drapeau `busy` + message
 * `error` lisible. Évite de redupliquer le bloc try/finally dans Host/Play.
 */
export function useAsyncAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, error, setError, run };
}
