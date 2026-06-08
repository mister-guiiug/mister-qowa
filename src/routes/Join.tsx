import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Screen, Button } from "../lib/ui";
import { joinSession } from "../firebase/api";
import { useGameStore } from "../store/gameStore";
import { errMsg } from "../lib/err";
import { PIN_LENGTH, MAX_PSEUDO_LEN } from "@shared/gameState";

export function Join() {
  const nav = useNavigate();
  const setPlayer = useGameStore((s) => s.setPlayer);
  const [searchParams] = useSearchParams();
  const [pin, setPin] = useState(() =>
    (searchParams.get("pin") ?? "").replace(/\D/g, "").slice(0, PIN_LENGTH),
  );
  const [pseudo, setPseudo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = pin.length === PIN_LENGTH && pseudo.trim().length > 0;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const { sessionId } = await joinSession(pin, pseudo.trim());
      setPlayer({ sessionId, pin, pseudo: pseudo.trim() });
      nav(`/play/${sessionId}`);
    } catch (e2) {
      setError(errMsg(e2));
      setBusy(false);
    }
  }

  return (
    <Screen>
      <button
        type="button"
        onClick={() => nav("/")}
        className="mb-4 inline-flex items-center gap-1 self-start text-sm text-white/60 hover:text-white"
      >
        <ArrowLeft className="size-4" /> Accueil
      </button>
      <h1 className="font-display text-3xl">Rejoindre une partie</h1>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-white/60">Code PIN</span>
          <input
            inputMode="numeric"
            autoComplete="off"
            value={pin}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH))
            }
            placeholder="12345678"
            className="rounded-2xl bg-white/10 px-4 py-3 text-center font-display text-2xl tracking-[0.25em] outline-none ring-1 ring-white/15 focus:ring-brand"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-white/60">Ton pseudo</span>
          <input
            value={pseudo}
            maxLength={MAX_PSEUDO_LEN}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Alex"
            className="rounded-2xl bg-white/10 px-4 py-3 text-lg outline-none ring-1 ring-white/15 focus:ring-brand"
          />
        </label>

        {error ? (
          <p className="rounded-xl bg-rose-500/20 px-4 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        <Button type="submit" full disabled={!ready || busy}>
          {busy ? "Connexion…" : "Entrer dans la partie"}
        </Button>
      </form>
    </Screen>
  );
}
