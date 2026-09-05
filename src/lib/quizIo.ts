/** Duplication + import/export JSON d'un quiz (quiz local-first). */
import {
  downloadJson,
  readJsonFile,
} from "@mister-guiiug/dev-pwa-config/download";
import { quizSchema, type Quiz } from "@shared/contracts";
import { AppError } from "./appError";

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
  downloadJson(
    quiz,
    `${(quiz.title || "quiz").replace(/[^\w.-]+/g, "_")}.json`,
  );
}

export async function importQuizFile(file: File): Promise<Quiz> {
  let json: unknown;
  try {
    json = await readJsonFile(file);
  } catch {
    throw new AppError("err.fileUnreadable");
  }
  const parsed = quizSchema.safeParse(json);
  if (!parsed.success) throw new AppError("err.notAQuiz");
  return { ...parsed.data, id: crypto.randomUUID(), createdAt: Date.now() };
}
