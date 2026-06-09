/** Duplication + import/export JSON d'un quiz (quiz local-first). */
import { quizSchema, type Quiz } from "@shared/contracts";

/**
 * Empreinte de CONTENU d'un quiz (ignore id/createdAt/ownerUid) : sert à
 * détecter un import/duplicata déjà présent dans la bibliothèque.
 */
export function quizContentKey(quiz: Quiz): string {
  return JSON.stringify({
    title: quiz.title.trim(),
    description: (quiz.description ?? "").trim(),
    questions: quiz.questions.map((q) => {
      const { id: _id, ...rest } = q;
      return rest;
    }),
  });
}

/** Le quiz a-t-il un jumeau (même contenu) dans la liste ? */
export function findDuplicate(quiz: Quiz, library: Quiz[]): Quiz | undefined {
  const key = quizContentKey(quiz);
  return library.find((q) => quizContentKey(q) === key);
}

export function duplicateQuiz(quiz: Quiz): Quiz {
  return {
    ...quiz,
    id: crypto.randomUUID(),
    title: `${quiz.title} (copie)`,
    createdAt: Date.now(),
  };
}

export function exportQuiz(quiz: Quiz): void {
  const blob = new Blob([JSON.stringify(quiz, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(quiz.title || "quiz").replace(/[^\w.-]+/g, "_")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importQuizFile(file: File): Promise<Quiz> {
  let json: unknown;
  try {
    json = JSON.parse(await file.text());
  } catch {
    throw new Error("Fichier illisible (JSON invalide).");
  }
  const parsed = quizSchema.safeParse(json);
  if (!parsed.success) throw new Error("Ce fichier n’est pas un quiz valide.");
  return { ...parsed.data, id: crypto.randomUUID(), createdAt: Date.now() };
}
