import { describe, it, expect } from "vitest";
import {
  questionSchema,
  quizSchema,
  submitAnswerInput,
  joinSessionInput,
  answerNodeSchema,
} from "./contracts";
import { DEMO_QUIZ } from "./seed";

describe("contracts", () => {
  it("valide le quiz de démo", () => {
    expect(quizSchema.safeParse(DEMO_QUIZ).success).toBe(true);
  });

  it("valide une question à choix multiple", () => {
    const q = {
      id: "x",
      type: "multiple_choice",
      prompt: "2 + 2 ?",
      timeLimitMs: 20000,
      basePoints: 1000,
      options: [
        { id: "a", label: "3" },
        { id: "b", label: "4" },
      ],
      correctOptionId: "b",
    };
    expect(questionSchema.safeParse(q).success).toBe(true);
  });

  it("rejette un QCM sans bonne réponse", () => {
    const bad = {
      id: "x",
      type: "multiple_choice",
      prompt: "?",
      timeLimitMs: 20000,
      basePoints: 1000,
      options: [{ id: "a", label: "3" }],
    };
    expect(questionSchema.safeParse(bad).success).toBe(false);
  });

  it("rejette un pseudo trop long au join", () => {
    expect(
      joinSessionInput.safeParse({ pin: "12345678", pseudo: "x".repeat(40) })
        .success,
    ).toBe(false);
  });

  it("valide une soumission de réponse", () => {
    expect(
      submitAnswerInput.safeParse({
        sessionId: "s1",
        questionId: "q1",
        choice: "b",
      }).success,
    ).toBe(true);
  });

  it("le nœud réponse exige choice + serverTs", () => {
    expect(
      answerNodeSchema.safeParse({ choice: "b", serverTs: 123 }).success,
    ).toBe(true);
    expect(answerNodeSchema.safeParse({ choice: "b" }).success).toBe(false);
  });
});
