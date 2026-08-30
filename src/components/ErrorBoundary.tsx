import type { ReactNode } from "react";
import { ErrorBoundary as DwcErrorBoundary } from "@mister-guiiug/dev-wpa-config/react/error-boundary";
import { tStatic } from "../i18n";
import { reportError } from "../lib/report";

/**
 * Garde-fou anti écran blanc, sur la mécanique du socle (`react/error-boundary`).
 * Le câblage reste maison : `onError` relaie vers `reportError` (report.ts,
 * choix assumé de l'app — pas l'ObservabilityBoundary du socle) et `fallback`
 * garde l'écran de crash local, qui RECHARGE (le remontage du socle rejouerait
 * souvent le crash) et traduit au moment du rendu (`tStatic` lit la langue
 * active à l'affichage, pas au démarrage).
 */
function CrashScreen() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-3xl">{tStatic("err.crashTitle")}</h1>
      <p className="text-white/70">{tStatic("err.crashBody")}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-2xl bg-brand px-5 py-3 font-semibold text-white"
      >
        {tStatic("common.reload")}
      </button>
    </main>
  );
}

export function ErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <DwcErrorBoundary
      fallback={() => <CrashScreen />}
      onError={(error, info) =>
        reportError(error, {
          boundary: true,
          componentStack: info.componentStack,
        })
      }
    >
      {children}
    </DwcErrorBoundary>
  );
}
