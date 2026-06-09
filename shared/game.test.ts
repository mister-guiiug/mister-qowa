import { describe, it, expect } from "vitest";
import {
  isCorrect,
  correctChoiceOf,
  basePointsOf,
  publicQuestionFields,
} from "./game";
import { shardOf, ANSWER_SHARDS } from "./gameState";
import { makeTeams, TEAM_PRESETS } from "./teams";
import type { Question } from "./contracts";

const tf: Question = {
  id: "q",
  type: "true_false",
  prompt: "Le ciel est bleu",
  timeLimitMs: 10000,
  basePoints: 1000,
  correct: true,
};

const free: Question = {
  id: "f",
  type: "free_text",
  prompt: "Capitale ?",
  timeLimitMs: 10000,
  basePoints: 1000,
  acceptedAnswers: ["Paris", "paris"],
  caseSensitive: false,
};

describe("game helpers", () => {
  it("isCorrect — true_false", () => {
    expect(isCorrect(tf, "true")).toBe(true);
    expect(isCorrect(tf, "false")).toBe(false);
  });

  it("isCorrect — free_text insensible à la casse", () => {
    expect(isCorrect(free, "PARIS")).toBe(true);
    expect(isCorrect(free, "Lyon")).toBe(false);
  });

  it("correctChoiceOf", () => {
    expect(correctChoiceOf(tf)).toBe("true");
    expect(correctChoiceOf(free)).toBe("Paris");
  });

  it("basePointsOf — poll vaut 0", () => {
    const poll: Question = {
      id: "p",
      type: "poll",
      prompt: "?",
      timeLimitMs: 10000,
      options: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
    };
    expect(basePointsOf(poll)).toBe(0);
    expect(basePointsOf(tf)).toBe(1000);
  });

  it("publicQuestionFields n'expose PAS la bonne réponse", () => {
    const pub = publicQuestionFields(tf, 0, 3) as Record<string, unknown>;
    expect(pub).not.toHaveProperty("correct");
    expect(pub).not.toHaveProperty("activatedAt");
    expect(pub.scored).toBe(true);
    expect(pub.options).toEqual([
      { id: "true", label: "Vrai" },
      { id: "false", label: "Faux" },
    ]);
  });
});

describe("shardOf", () => {
  it("est déterministe et borné", () => {
    expect(shardOf("abc")).toBe(shardOf("abc"));
    for (const uid of ["a", "xyz", "long-uid-123", ""]) {
      const s = shardOf(uid);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThan(ANSWER_SHARDS);
    }
  });
});

describe("makeTeams", () => {
  it("borne le nombre d'équipes à 2..4", () => {
    expect(makeTeams(1)).toHaveLength(2);
    expect(makeTeams(3)).toHaveLength(3);
    expect(makeTeams(9)).toHaveLength(4);
    expect(makeTeams(3)).toEqual(TEAM_PRESETS.slice(0, 3));
  });
});
