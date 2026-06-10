import { useCallback, useState } from "react";
import { useErr } from "../i18n";

/**
 * Gestion factorisée d'une action asynchrone : drapeau `busy` + message
 * `error` lisible (traduit). Évite de redupliquer le bloc try/finally.
 */
export function useAsyncAction() {
  const err = useErr();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (fn: () => Promise<unknown>) => {
      setBusy(true);
      setError(null);
      try {
        await fn();
      } catch (e) {
        setError(err(e));
      } finally {
        setBusy(false);
      }
    },
    [err],
  );

  return { busy, error, setError, run };
}
