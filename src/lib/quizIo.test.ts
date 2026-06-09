import { describe, it, expect } from "vitest";
import { quizContentKey, findDuplicate, duplicateQuiz } from "./quizIo";
import type { Quiz } from "@shared/contracts";

const quiz: Quiz = {
  id: "a",
  title: "Géo",
  questions: [
    {
      id: "q1",
      type: "true_false",
      prompt: "Paris est en France",
      timeLimitMs: 10000,
      basePoints: 1000,
      correct: true,
    },
  ],
};

describe("quizContentKey / findDuplicate", () => {
  it("ignore id et createdAt (même contenu = même clé)", () => {
    const copy: Quiz = { ...quiz, id: "b", createdAt: 999 };
    expect(quizContentKey(copy)).toBe(quizContentKey(quiz));
  });

  it("change si le contenu change", () => {
    const other: Quiz = { ...quiz, title: "Histoire" };
    expect(quizContentKey(other)).not.toBe(quizContentKey(quiz));
  });

  it("détecte un duplicata dans la bibliothèque", () => {
    const dup = duplicateQuiz(quiz); // nouveau id, titre « (copie) »
    expect(findDuplicate(quiz, [dup])).toBeUndefined(); // titre différent
    expect(findDuplicate({ ...quiz, id: "z" }, [quiz])).toBe(quiz);
  });
});
