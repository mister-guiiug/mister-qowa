import { Component, type ReactNode } from "react";

interface State {
  error: Error | null;
}

/** Garde-fou : capture les erreurs de rendu et propose de recharger. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="font-display text-3xl">Oups…</h1>
          <p className="text-white/70">
            Une erreur est survenue. Recharge l’application pour repartir.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-brand px-5 py-3 font-semibold text-white"
          >
            Recharger
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
