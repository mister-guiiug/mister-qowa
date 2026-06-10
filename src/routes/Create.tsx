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
import {
  duplicateQuiz,
  exportQuiz,
  importQuizFile,
  findDuplicate,
} from "../lib/quizIo";
import { makeTeams } from "@shared/teams";
import { errMsg } from "../lib/err";
import { useT } from "../i18n";

export function Create() {
  const t = useT();
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
  const [elimination, setElimination] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Quiz | null>(null);

  async function host(quiz: Quiz) {
    setBusy(quiz.id);
    setError(null);
    try {
      const { sessionId, pin } = await createSession(
        quiz,
        teamMode ? makeTeams(teamCount) : undefined,
        { elimination },
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
      const imported = await importQuizFile(file);
      const dup = findDuplicate(imported, myQuizzes);
      if (dup) {
        setError(t("create.duplicateExists", { title: dup.title }));
        return;
      }
      upsert(imported);
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
        <ArrowLeft className="size-4" /> {t("common.home")}
      </button>

      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl">{t("create.title")}</h1>
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
            aria-label={t("create.importAria")}
          >
            <Upload className="size-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => nav("/create/ai")}
            aria-label={t("create.aiAria")}
          >
            <Sparkles className="size-4" />
          </Button>
          <Button onClick={() => nav("/create/new")}>
            <Plus className="size-4" /> {t("create.new")}
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
          {t("create.teamMode")}
        </label>
        {teamMode ? (
          <select
            value={teamCount}
            onChange={(e) => setTeamCount(Number(e.target.value))}
            aria-label={t("create.teamsCountAria")}
            className="rounded-xl bg-white/10 px-3 py-1.5 outline-none ring-1 ring-white/15"
          >
            {[2, 3, 4].map((n) => (
              <option key={n} value={n} className="bg-[#1a1230]">
                {t("create.teamsOption", { n })}
              </option>
            ))}
          </select>
        ) : null}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={elimination}
            onChange={(e) => setElimination(e.target.checked)}
            className="size-4 accent-brand"
          />
          {t("create.eliminationMode")}
        </label>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-rose-500/20 px-4 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {myQuizzes.length > 0 ? (
        <section className="mt-6">
          <h2 className="mb-2 text-sm uppercase tracking-widest text-white/40">
            {t("create.myQuizzes")}
          </h2>
          <div className="flex flex-col gap-3">
            {myQuizzes.map((q) => (
              <Card key={q.id} className="flex flex-col gap-3">
                <div>
                  <p className="font-semibold">{q.title}</p>
                  <p className="text-sm text-white/60">
                    {t("create.questionsCount", { n: q.questions.length })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => host(q)}
                    disabled={busy !== null}
                    className="flex-1"
                  >
                    <Play className="size-4" /> {t("create.launch")}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => nav(`/create/${q.id}`)}
                    aria-label={t("create.editAria")}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => upsert(duplicateQuiz(q))}
                    aria-label={t("create.duplicateAria")}
                  >
                    <Copy className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => exportQuiz(q)}
                    aria-label={t("create.exportAria")}
                  >
                    <Download className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setPendingDelete(q)}
                    aria-label={t("create.deleteAria")}
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
          {t("create.demoQuizzes")}
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
                  {t("create.questionsCount", { n: q.questions.length })}
                  {q.description ? ` · ${q.description}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="ghost"
                  onClick={() => upsert(duplicateQuiz(q))}
                  aria-label={t("create.copyToMineAria")}
                >
                  <Copy className="size-4" />
                </Button>
                <Button onClick={() => host(q)} disabled={busy !== null}>
                  <Play className="size-4" /> {t("create.launch")}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {busy ? <Spinner label={t("create.creating")} /> : null}

      {pendingDelete ? (
        <ConfirmDialog
          title={t("create.deleteTitle", { title: pendingDelete.title })}
          message={t("create.deleteMsg")}
          confirmLabel={t("create.deleteAria")}
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
