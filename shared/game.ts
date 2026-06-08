/**
 * Helpers de jeu PURS, partagés (host client en mode Spark, ou Cloud Functions
 * en mode Blaze). Aucune dépendance Firebase — juste de la logique.
 */
import type { Question } from "./contracts";
import { freeTextMatches } from "./normalize";

export function basePointsOf(q: Question): number {
  return q.type === "poll" ? 0 : q.basePoints;
}

export function isCorrect(q: Question, choice: string): boolean {
  switch (q.type) {
    case "multiple_choice":
      return choice === q.correctOptionId;
    case "true_false":
      return (choice === "true") === q.correct;
    case "free_text":
      return freeTextMatches(choice, q.acceptedAnswers, q.caseSensitive);
    case "poll":
      return false;
  }
}

export function correctChoiceOf(q: Question): string {
  switch (q.type) {
    case "multiple_choice":
      return q.correctOptionId;
    case "true_false":
      return q.correct ? "true" : "false";
    case "free_text":
      return q.acceptedAnswers[0];
    case "poll":
      return "";
  }
}

/** Champs publics d'une question (SANS la bonne réponse, SANS activatedAt). */
export function publicQuestionFields(
  q: Question,
  index: number,
  total: number,
) {
  const base = {
    questionId: q.id,
    index,
    total,
    type: q.type,
    prompt: q.prompt,
    timeLimitMs: q.timeLimitMs,
    scored: q.type !== "poll",
    ...(q.mediaUrl ? { mediaUrl: q.mediaUrl } : {}),
  };
  if (q.type === "multiple_choice" || q.type === "poll") {
    return { ...base, options: q.options };
  }
  if (q.type === "true_false") {
    return {
      ...base,
      options: [
        { id: "true", label: "Vrai" },
        { id: "false", label: "Faux" },
      ],
    };
  }
  return base;
}
