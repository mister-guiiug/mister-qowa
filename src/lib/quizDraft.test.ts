import { describe, it, expect } from "vitest";
import {
  blankQuiz,
  blankQuestion,
  toQuiz,
  toDraft,
  validateDraft,
  retypeQuestion,
} from "./quizDraft";
import { quizSchema } from "@shared/contracts";

function validMcDraft() {
  const d = blankQuiz();
  d.title = "Test";
  const q = d.questions[0];
  q.prompt = "2 + 2 ?";
  q.options[0] = { id: "a", label: "3" };
  q.options[1] = { id: "b", label: "4" };
  q.correctOptionId = "b";
  return d;
}

describe("quizDraft", () => {
  it("un quiz vierge est invalide", () => {
    expect(validateDraft(blankQuiz()).length).toBeGreaterThan(0);
  });

  it("brouillon MC complet → valide + Quiz zod-valide", () => {
    const d = validMcDraft();
    expect(validateDraft(d)).toEqual([]);
    expect(quizSchema.safeParse(toQuiz(d)).success).toBe(true);
  });

  it("roundtrip toDraft(toQuiz) conserve type + bonne réponse", () => {
    const d2 = toDraft(toQuiz(validMcDraft()));
    expect(d2.questions[0].type).toBe("multiple_choice");
    expect(d2.questions[0].correctOptionId).toBe("b");
  });

  it("true_false → Quiz valide", () => {
    const d = blankQuiz();
    d.title = "T";
    d.questions[0] = {
      ...blankQuestion("true_false"),
      prompt: "vrai ?",
      correct: false,
    };
    expect(validateDraft(d)).toEqual([]);
    expect(quizSchema.safeParse(toQuiz(d)).success).toBe(true);
  });

  it("MC sans bonne réponse → erreur", () => {
    const d = validMcDraft();
    d.questions[0].correctOptionId = "";
    expect(validateDraft(d).some((e) => e.key === "err.vSelectCorrect")).toBe(
      true,
    );
  });

  it("retypeQuestion vers free_text réinitialise les champs spécifiques", () => {
    const r = retypeQuestion(blankQuestion("multiple_choice"), "free_text");
    expect(r.type).toBe("free_text");
    expect(r.acceptedAnswers.length).toBe(1);
    expect(r.options.length).toBe(0);
  });

  it("retype multiple_choice → poll → multiple_choice conserve la bonne réponse", () => {
    let q = validMcDraft().questions[0];
    q = retypeQuestion(q, "poll");
    q = retypeQuestion(q, "multiple_choice");
    expect(q.correctOptionId).toBe("b");
  });

  it("détecte deux réponses identiques", () => {
    const d = validMcDraft();
    d.questions[0].options[1] = { id: "c", label: "3" };
    expect(
      validateDraft(d).some((e) => e.key === "err.vDuplicateOptions"),
    ).toBe(true);
  });

  it("détecte des identifiants d'option en double", () => {
    const d = validMcDraft();
    d.questions[0].options[1] = { id: "a", label: "5" };
    d.questions[0].correctOptionId = "a";
    expect(
      validateDraft(d).some((e) => e.key === "err.vDuplicateOptionIds"),
    ).toBe(true);
  });
});
