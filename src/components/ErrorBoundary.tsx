import { Component, type ErrorInfo, type ReactNode } from "react";
import { tStatic } from "../i18n";
import { reportError } from "../lib/report";

interface State {
  error: Error | null;
}

/** Garde-fou : capture les erreurs de rendu et propose de recharger. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    reportError(error, {
      boundary: true,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.error) {
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
    return this.props.children;
  }
}
