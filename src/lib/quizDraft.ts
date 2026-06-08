/**
 * Brouillon éditable d'un quiz : une forme « plate » (tous les champs présents)
 * pratique pour les formulaires, convertie en `Quiz` validé (union discriminée)
 * au moment d'enregistrer.
 */
import type { Question, Quiz, QuizOption } from "@shared/contracts";
import type { QuestionType } from "@shared/gameState";
import { DEFAULT_TIME_LIMIT_MS, DEFAULT_BASE_POINTS } from "@shared/gameState";

export interface DraftQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  timeLimitMs: number;
  basePoints: number;
  options: QuizOption[]; // multiple_choice / poll
  correctOptionId: string; // multiple_choice
  correct: boolean; // true_false
  acceptedAnswers: string[]; // free_text
  caseSensitive: boolean; // free_text
  mediaUrl?: string; // image optionnelle
  mediaAlt?: string; // texte alternatif de l'image (a11y)
}

export interface DraftQuiz {
  id: string;
  title: string;
  description: string;
  questions: DraftQuestion[];
}

const uid = () => crypto.randomUUID();

export function blankOption(label = ""): QuizOption {
  return { id: uid().slice(0, 8), label };
}

export function blankQuestion(
  type: QuestionType = "multiple_choice",
): DraftQuestion {
  const withOptions = type === "multiple_choice" || type === "poll";
  return {
    id: uid(),
    type,
    prompt: "",
    timeLimitMs: DEFAULT_TIME_LIMIT_MS,
    basePoints: DEFAULT_BASE_POINTS,
    options: withOptions ? [blankOption(), blankOption()] : [],
    correctOptionId: "",
    correct: true,
    acceptedAnswers: type === "free_text" ? [""] : [],
    caseSensitive: false,
  };
}

export function blankQuiz(): DraftQuiz {
  return {
    id: uid(),
    title: "",
    description: "",
    questions: [blankQuestion()],
  };
}

/** Change le type d'une question en (ré)initialisant les champs spécifiques. */
export function retypeQuestion(
  d: DraftQuestion,
  type: QuestionType,
): DraftQuestion {
  const fresh = blankQuestion(type);
  // conserve les options si on reste/revient sur un type à options
  const options =
    (type === "multiple_choice" || type === "poll") && d.options.length >= 2
      ? d.options
      : fresh.options;
  return {
    ...fresh,
    id: d.id,
    prompt: d.prompt,
    timeLimitMs: d.timeLimitMs,
    basePoints: d.basePoints,
    options,
    // préserve la bonne réponse tant qu'elle pointe une option conservée
    // (survit à un aller-retour multiple_choice <-> sondage)
    correctOptionId: options.some((o) => o.id === d.correctOptionId)
      ? d.correctOptionId
      : "",
  };
}

export function toDraft(quiz: Quiz): DraftQuiz {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description ?? "",
    questions: quiz.questions.map((q) => {
      const base = blankQuestion(q.type);
      base.id = q.id;
      base.prompt = q.prompt;
      base.timeLimitMs = q.timeLimitMs;
      base.basePoints = q.type === "poll" ? DEFAULT_BASE_POINTS : q.basePoints;
      base.mediaUrl = q.mediaUrl;
      base.mediaAlt = q.mediaAlt;
      if (q.type === "multiple_choice") {
        base.options = q.options;
        base.correctOptionId = q.correctOptionId;
      } else if (q.type === "poll") {
        base.options = q.options;
      } else if (q.type === "true_false") {
        base.correct = q.correct;
      } else {
        base.acceptedAnswers = q.acceptedAnswers;
        base.caseSensitive = q.caseSensitive;
      }
      return base;
    }),
  };
}

export function toQuestion(d: DraftQuestion): Question {
  const prompt = d.prompt.trim();
  const opts = d.options.filter((o) => o.label.trim());
  const media = d.mediaUrl?.trim()
    ? {
        mediaUrl: d.mediaUrl.trim(),
        ...(d.mediaAlt?.trim() ? { mediaAlt: d.mediaAlt.trim() } : {}),
      }
    : {};
  switch (d.type) {
    case "multiple_choice":
      return {
        id: d.id,
        type: "multiple_choice",
        prompt,
        timeLimitMs: d.timeLimitMs,
        basePoints: d.basePoints,
        options: opts,
        correctOptionId: d.correctOptionId,
        ...media,
      };
    case "true_false":
      return {
        id: d.id,
        type: "true_false",
        prompt,
        timeLimitMs: d.timeLimitMs,
        basePoints: d.basePoints,
        correct: d.correct,
        ...media,
      };
    case "free_text":
      return {
        id: d.id,
        type: "free_text",
        prompt,
        timeLimitMs: d.timeLimitMs,
        basePoints: d.basePoints,
        acceptedAnswers: d.acceptedAnswers.map((a) => a.trim()).filter(Boolean),
        caseSensitive: d.caseSensitive,
        ...media,
      };
    case "poll":
      return {
        id: d.id,
        type: "poll",
        prompt,
        timeLimitMs: d.timeLimitMs,
        options: opts,
        ...media,
      };
  }
}

export function toQuiz(d: DraftQuiz): Quiz {
  return {
    id: d.id,
    title: d.title.trim(),
    description: d.description.trim() || undefined,
    questions: d.questions.map(toQuestion),
  };
}

/** Erreurs de validation lisibles (vide = valide). */
export function validateDraft(d: DraftQuiz): string[] {
  const errs: string[] = [];
  if (!d.title.trim()) errs.push("Donne un titre au quiz.");
  if (d.questions.length === 0) errs.push("Ajoute au moins une question.");
  d.questions.forEach((q, i) => {
    const n = i + 1;
    if (!q.prompt.trim()) errs.push(`Q${n} : l’énoncé est vide.`);
    if (q.type === "multiple_choice" || q.type === "poll") {
      const opts = q.options.filter((o) => o.label.trim());
      if (opts.length < 2) {
        errs.push(
          q.options.length >= 2
            ? `Q${n} : remplis au moins 2 réponses (certaines sont vides).`
            : `Q${n} : il faut au moins 2 réponses.`,
        );
      }
      const labels = opts.map((o) => o.label.trim().toLowerCase());
      if (new Set(labels).size !== labels.length) {
        errs.push(`Q${n} : deux réponses sont identiques.`);
      }
      if (new Set(opts.map((o) => o.id)).size !== opts.length) {
        errs.push(`Q${n} : identifiants de réponse en double.`);
      }
      if (
        q.type === "multiple_choice" &&
        !opts.some((o) => o.id === q.correctOptionId)
      ) {
        errs.push(`Q${n} : sélectionne la bonne réponse.`);
      }
    }
    if (
      q.type === "free_text" &&
      q.acceptedAnswers.filter((a) => a.trim()).length === 0
    ) {
      errs.push(`Q${n} : ajoute au moins une réponse acceptée.`);
    }
  });
  return errs;
}
