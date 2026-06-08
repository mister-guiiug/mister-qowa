import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Download,
  Upload,
  Sparkles,
} from "lucide-react";
import { Screen, Button, Card, Spinner } from "../lib/ui";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DEMO_QUIZZES } from "@shared/seed";
import type { Quiz } from "@shared/contracts";
import { createSession } from "../firebase/api";
import { useGameStore } from "../store/gameStore";
import { useQuizLibrary } from "../store/quizStore";
import { duplicateQuiz, exportQuiz, importQuizFile } from "../lib/quizIo";
import { makeTeams } from "@shared/teams";
import { errMsg } from "../lib/err";

export function Create() {
  const nav = useNavigate();
  const setHost = useGameStore((s) => s.setHost);
  const myQuizzes = useQuizLibrary((s) => s.quizzes);
  const upsert = useQuizLibrary((s) => s.upsert);
  const remove = useQuizLibrary((s) => s.remove);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [teamMode, setTeamMode] = useState(false);
  const [teamCount, setTeamCount] = useState(2);
  const [pendingDelete, setPendingDelete] = useState<Quiz | null>(null);

  async function host(quiz: Quiz) {
    setBusy(quiz.id);
    setError(null);
    try {
      const { sessionId, pin } = await createSession(
        quiz,
        teamMode ? makeTeams(teamCount) : undefined,
      );
      setHost({ sessionId, pin, quiz });
      nav(`/host/${sessionId}`);
    } catch (e) {
      setError(errMsg(e));
      setBusy(null);
    }
  }

  async function onImport(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      upsert(await importQuizFile(file));
    } catch (e) {
      setError(errMsg(e));
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
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              void onImport(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button
            variant="ghost"
            onClick={() => fileRef.current?.click()}
            aria-label="Importer un quiz"
          >
            <Upload className="size-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => nav("/create/ai")}
            aria-label="Générer un quiz par IA"
          >
            <Sparkles className="size-4" />
          </Button>
          <Button onClick={() => nav("/create/new")}>
            <Plus className="size-4" /> Nouveau
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white/5 p-3 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={teamMode}
            onChange={(e) => setTeamMode(e.target.checked)}
            className="size-4 accent-brand"
          />
          Mode équipe
        </label>
        {teamMode ? (
          <select
            value={teamCount}
            onChange={(e) => setTeamCount(Number(e.target.value))}
            aria-label="Nombre d’équipes"
            className="rounded-xl bg-white/10 px-3 py-1.5 outline-none ring-1 ring-white/15"
          >
            {[2, 3, 4].map((n) => (
              <option key={n} value={n} className="bg-[#1a1230]">
                {n} équipes
              </option>
            ))}
          </select>
        ) : null}
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
                    onClick={() => upsert(duplicateQuiz(q))}
                    aria-label="Dupliquer"
                  >
                    <Copy className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => exportQuiz(q)}
                    aria-label="Exporter"
                  >
                    <Download className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setPendingDelete(q)}
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
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="ghost"
                  onClick={() => upsert(duplicateQuiz(q))}
                  aria-label="Copier dans mes quiz pour l’éditer"
                >
                  <Copy className="size-4" />
                </Button>
                <Button onClick={() => host(q)} disabled={busy !== null}>
                  <Play className="size-4" /> Lancer
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {busy ? <Spinner label="Création de la partie…" /> : null}

      {pendingDelete ? (
        <ConfirmDialog
          title={`Supprimer « ${pendingDelete.title} » ?`}
          message="Cette action est définitive."
          confirmLabel="Supprimer"
          danger
          onConfirm={() => {
            remove(pendingDelete.id);
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
    </Screen>
  );
}
