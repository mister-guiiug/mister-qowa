/** Brouillon « nouveau quiz » partagé (éditeur + génération IA), persistant. */
import type { DraftQuiz } from "./quizDraft";

export const DRAFT_KEY = "mister-qowa:draft";

export function saveDraft(d: DraftQuiz): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {
    /* quota plein : on ignore */
  }
}

export function loadDraft(): DraftQuiz | null {
  try {
    const s = localStorage.getItem(DRAFT_KEY);
    return s ? (JSON.parse(s) as DraftQuiz) : null;
  } catch {
    return null; // brouillon corrompu : on repart à neuf
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
