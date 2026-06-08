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
} from "../lib/quizDraft";

const field =
  "rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/15 focus:ring-brand";
const DRAFT_KEY = "mister-qowa:draft";

export function QuizEditor() {
  const nav = useNavigate();
  const { quizId } = useParams();
  const getQuiz = useQuizLibrary((s) => s.get);
  const upsert = useQuizLibrary((s) => s.upsert);

  const [draft, setDraft] = useState<DraftQuiz>(() => {
    if (quizId) {
      const existing = getQuiz(quizId);
      if (existing) return toDraft(existing);
    }
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!quizId && saved) return JSON.parse(saved) as DraftQuiz;
    } catch {
      /* brouillon corrompu : on repart à neuf */
    }
    return blankQuiz();
  });
  const [errors, setErrors] = useState<string[]>([]);

  // Autosave du brouillon « nouveau » (récupéré après un refresh).
  useEffect(() => {
    if (quizId) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* quota plein : on ignore */
    }
  }, [draft, quizId]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  };

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
      [qs[i], qs[j]] = [qs[j], qs[i]];
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
        <ArrowLeft className="size-4" /> Annuler
      </button>
      <h1 className="font-display text-3xl">
        {quizId ? "Modifier le quiz" : "Nouveau quiz"}
      </h1>

      <div className="mt-5 flex flex-col gap-3">
        <input
          value={draft.title}
          maxLength={120}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Titre du quiz"
          className={`${field} font-display text-xl`}
        />
        <input
          value={draft.description}
          maxLength={300}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder="Description (optionnelle)"
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
        <Plus className="size-5" /> Ajouter une question
      </Button>

      {errors.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-1 rounded-2xl bg-rose-500/15 p-4 text-sm text-rose-200">
          {errors.map((e, i) => (
            <li key={i}>• {e}</li>
          ))}
        </ul>
      ) : null}

      <Button full className="mt-4" onClick={save}>
        <Save className="size-5" /> Enregistrer le quiz
      </Button>
    </Screen>
  );
}
