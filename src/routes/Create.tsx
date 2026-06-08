import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play } from "lucide-react";
import { Screen, Button, Card, Spinner } from "../lib/ui";
import { DEMO_QUIZZES } from "@shared/seed";
import { createSession } from "../firebase/api";
import { useGameStore } from "../store/gameStore";
import { errMsg } from "../lib/err";

export function Create() {
  const nav = useNavigate();
  const setHost = useGameStore((s) => s.setHost);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function host(quizId: string) {
    setBusy(quizId);
    setError(null);
    try {
      const { sessionId, pin } = await createSession(quizId);
      setHost({ sessionId, pin, quizId });
      nav(`/host/${sessionId}`);
    } catch (e) {
      setError(errMsg(e));
      setBusy(null);
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
      <h1 className="font-display text-3xl">Héberger un quiz</h1>
      <p className="mt-1 text-sm text-white/60">
        Choisis un quiz, partage le PIN, et lance la partie.
      </p>

      {error ? (
        <p className="mt-4 rounded-xl bg-rose-500/20 px-4 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        {DEMO_QUIZZES.map((q) => (
          <Card key={q.id} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold">{q.title}</p>
              <p className="text-sm text-white/60">
                {q.questions.length} questions
                {q.description ? ` · ${q.description}` : ""}
              </p>
            </div>
            <Button onClick={() => host(q.id)} disabled={busy !== null}>
              <Play className="size-4" /> Lancer
            </Button>
          </Card>
        ))}
      </div>

      {busy ? <Spinner label="Création de la partie…" /> : null}

      <p className="mt-6 text-center text-xs text-white/40">
        Créer ton propre quiz (éditeur, médias, 4 types de questions) arrive en
        V1.
      </p>
    </Screen>
  );
}
