import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Plus, Pencil, Trash2 } from "lucide-react";
import { Screen, Button, Card, Spinner } from "../lib/ui";
import { DEMO_QUIZZES } from "@shared/seed";
import type { Quiz } from "@shared/contracts";
import { createSession } from "../firebase/api";
import { useGameStore } from "../store/gameStore";
import { useQuizLibrary } from "../store/quizStore";
import { errMsg } from "../lib/err";

export function Create() {
  const nav = useNavigate();
  const setHost = useGameStore((s) => s.setHost);
  const myQuizzes = useQuizLibrary((s) => s.quizzes);
  const remove = useQuizLibrary((s) => s.remove);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function host(quiz: Quiz) {
    setBusy(quiz.id);
    setError(null);
    try {
      const { sessionId, pin } = await createSession(quiz);
      setHost({ sessionId, pin, quiz });
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

      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Quiz</h1>
        <Button onClick={() => nav("/create/new")}>
          <Plus className="size-4" /> Nouveau
        </Button>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-rose-500/20 px-4 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {myQuizzes.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-2 text-sm uppercase tracking-widest text-white/40">
            Mes quiz
          </h2>
          <div className="flex flex-col gap-3">
            {myQuizzes.map((q) => (
              <Card key={q.id} className="flex flex-col gap-3">
                <div>
                  <p className="font-semibold">{q.title}</p>
                  <p className="text-sm text-white/60">
                    {q.questions.length} question
                    {q.questions.length > 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => host(q)}
                    disabled={busy !== null}
                    className="flex-1"
                  >
                    <Play className="size-4" /> Lancer
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => nav(`/create/${q.id}`)}
                    aria-label="Modifier"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm(`Supprimer « ${q.title} » ?`))
                        remove(q.id);
                    }}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="mb-2 text-sm uppercase tracking-widest text-white/40">
          Quiz de démo
        </h2>
        <div className="flex flex-col gap-3">
          {DEMO_QUIZZES.map((q) => (
            <Card
              key={q.id}
              className="flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-semibold">{q.title}</p>
                <p className="text-sm text-white/60">
                  {q.questions.length} questions
                  {q.description ? ` · ${q.description}` : ""}
                </p>
              </div>
              <Button onClick={() => host(q)} disabled={busy !== null}>
                <Play className="size-4" /> Lancer
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {busy ? <Spinner label="Création de la partie…" /> : null}
    </Screen>
  );
}
