import { describe, it, expect } from "vitest";
import { computeScore, STREAK_CAP, type ScoreInput } from "./scoring";

const base: ScoreInput = {
  correct: true,
  responseTimeMs: 0,
  timeLimitMs: 20_000,
  basePoints: 1000,
  streakBefore: 0,
  streakBonusPct: 10,
};

describe("computeScore", () => {
  it("réponse fausse => 0", () => {
    expect(computeScore({ ...base, correct: false })).toBe(0);
  });

  it("réponse instantanée => points pleins", () => {
    expect(computeScore({ ...base, responseTimeMs: 0 })).toBe(1000);
  });

  it("réponse à mi-temps => 75%", () => {
    expect(computeScore({ ...base, responseTimeMs: 10_000 })).toBe(750);
  });

  it("réponse à la dernière seconde => plancher 50%", () => {
    expect(computeScore({ ...base, responseTimeMs: 20_000 })).toBe(500);
  });

  it("streak de 3 => +30%", () => {
    expect(computeScore({ ...base, streakBefore: 3 })).toBe(1300);
  });

  it("streak plafonné à STREAK_CAP", () => {
    const capped = computeScore({ ...base, streakBefore: STREAK_CAP });
    const beyond = computeScore({ ...base, streakBefore: STREAK_CAP + 50 });
    expect(beyond).toBe(capped);
    expect(capped).toBe(1500);
  });

  it("temps de réponse jamais négatif", () => {
    expect(computeScore({ ...base, responseTimeMs: -500 })).toBe(1000);
  });
});
