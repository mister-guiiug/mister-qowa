/**
 * Remontée d'erreurs « Sentry-lite » — zéro dépendance, compatible Spark :
 * structure l'erreur, la logue, et (si `VITE_ERROR_ENDPOINT` est défini)
 * l'envoie en best-effort via `navigator.sendBeacon`. Sans endpoint = console
 * seule. Branche un collecteur (Sentry/own) en fournissant simplement l'URL.
 */
type Ctx = Record<string, unknown>;

export function reportError(error: unknown, context?: Ctx): void {
  const err = error instanceof Error ? error : new Error(String(error));
  const payload = {
    name: err.name,
    message: err.message,
    stack: err.stack,
    url: typeof location !== "undefined" ? location.href : "",
    ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
    ts: Date.now(),
    ...context,
  };
  console.error("[report]", payload);

  const endpoint = import.meta.env.VITE_ERROR_ENDPOINT;
  if (endpoint && typeof navigator !== "undefined" && navigator.sendBeacon) {
    try {
      navigator.sendBeacon(endpoint, JSON.stringify(payload));
    } catch {
      /* best-effort : on n'aggrave pas une erreur par une autre */
    }
  }
}

/** Capture les erreurs non gérées (à appeler une fois au démarrage). */
export function installGlobalErrorHandlers(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("error", (e) =>
    reportError(e.error ?? e.message, { type: "window.error" }),
  );
  window.addEventListener("unhandledrejection", (e) =>
    reportError(e.reason, { type: "unhandledrejection" }),
  );
}
