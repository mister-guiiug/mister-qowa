import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { Screen, Button } from "../lib/ui";
import { QuestionEditor } from "../components/QuestionEditor";
import { useQuizLibrary } from "../store/quizStore";
import {
  blankQuiz,
  blankQuestion,
  toDraft,
  toQuiz,
  validateDraft,
  type DraftQuiz,
  type DraftQuestion,
  type DraftError,
} from "../lib/quizDraft";
import { loadDraft, saveDraft, clearDraft } from "../lib/draft";
import { useT } from "../i18n";

const field =
  "rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/15 focus:ring-brand";

export function QuizEditor() {
  const t = useT();
  const nav = useNavigate();
  const { quizId } = useParams();
  const getQuiz = useQuizLibrary((s) => s.get);
  const upsert = useQuizLibrary((s) => s.upsert);

  const [draft, setDraft] = useState<DraftQuiz>(() => {
    if (quizId) {
      const existing = getQuiz(quizId);
      if (existing) return toDraft(existing);
    }
    if (!quizId) {
      const saved = loadDraft();
      if (saved) return saved;
    }
    return blankQuiz();
  });
  const [errors, setErrors] = useState<DraftError[]>([]);

  // Autosave du brouillon « nouveau » (récupéré après un refresh).
  useEffect(() => {
    if (quizId) return;
    saveDraft(draft);
  }, [draft, quizId]);

  const setQuestion = (i: number, q: DraftQuestion) =>
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((x, idx) => (idx === i ? q : x)),
    }));
  const removeQuestion = (i: number) =>
    setDraft((d) => ({
      ...d,
      questions: d.questions.filter((_, idx) => idx !== i),
    }));
  const addQuestion = () =>
    setDraft((d) => ({ ...d, questions: [...d.questions, blankQuestion()] }));
  const moveQuestion = (i: number, dir: -1 | 1) =>
    setDraft((d) => {
      const j = i + dir;
      if (j < 0 || j >= d.questions.length) return d;
      const qs = [...d.questions];
      const a = qs[i];
      const b = qs[j];
      if (!a || !b) return d;
      qs[i] = b;
      qs[j] = a;
      return { ...d, questions: qs };
    });

  function save() {
    const errs = validateDraft(draft);
    setErrors(errs);
    if (errs.length > 0) return;
    upsert(toQuiz(draft));
    clearDraft();
    nav("/create");
  }

  return (
    <Screen>
      <button
        type="button"
        onClick={() => {
          clearDraft();
          nav("/create");
        }}
        className="mb-4 inline-flex items-center gap-1 self-start text-sm text-white/60 hover:text-white"
      >
        <ArrowLeft className="size-4" /> {t("editor.cancel")}
      </button>
      <h1 className="font-display text-3xl">
        {quizId ? t("editor.titleEdit") : t("editor.titleNew")}
      </h1>

      <div className="mt-5 flex flex-col gap-3">
        <input
          value={draft.title}
          maxLength={120}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder={t("editor.titlePlaceholder")}
          className={`${field} font-display text-xl`}
        />
        <input
          value={draft.description}
          maxLength={300}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder={t("editor.descPlaceholder")}
          className={field}
        />
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {draft.questions.map((q, i) => (
          <QuestionEditor
            key={q.id}
            q={q}
            index={i}
            count={draft.questions.length}
            onChange={(nq) => setQuestion(i, nq)}
            onRemove={() => removeQuestion(i)}
            onMove={(dir) => moveQuestion(i, dir)}
          />
        ))}
      </div>

      <Button variant="ghost" full className="mt-4" onClick={addQuestion}>
        <Plus className="size-5" /> {t("editor.addQuestion")}
      </Button>

      {errors.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-1 rounded-2xl bg-rose-500/15 p-4 text-sm text-rose-200">
          {errors.map((e, i) => (
            <li key={i}>• {t(e.key, e.vars)}</li>
          ))}
        </ul>
      ) : null}

      <Button full className="mt-4" onClick={save}>
        <Save className="size-5" /> {t("editor.save")}
      </Button>
    </Screen>
  );
}
