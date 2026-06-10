import { describe, it, expect } from "vitest";
import { scoreRound, eliminateAfterRound } from "./round";
import { STREAK_BONUS_PCT } from "./gameState";
import type { Question, Score } from "./contracts";

const mcq: Question = {
  id: "q1",
  type: "multiple_choice",
  prompt: "Capitale de la France ?",
  timeLimitMs: 20000,
  basePoints: 1000,
  options: [
    { id: "a", label: "Paris" },
    { id: "b", label: "Lyon" },
  ],
  correctOptionId: "a",
};

describe("scoreRound", () => {
  it("récompense une bonne réponse et incrémente la série", () => {
    const r = scoreRound(
      mcq,
      { u1: { choice: "a", serverTs: 0 } },
      {},
      0,
      STREAK_BONUS_PCT,
    );
    expect(r.correctChoice).toBe("a");
    expect(r.scores.u1.total).toBeGreaterThan(0);
    expect(r.scores.u1.streak).toBe(1);
    expect(r.reveals.u1.correct).toBe(true);
  });

  it("donne 0 et remet la série à zéro sur mauvaise réponse", () => {
    const prev: Record<string, Score> = { u1: { total: 500, streak: 3 } };
    const r = scoreRound(
      mcq,
      { u1: { choice: "b", serverTs: 100 } },
      prev,
      0,
      STREAK_BONUS_PCT,
    );
    expect(r.reveals.u1.correct).toBe(false);
    expect(r.reveals.u1.awarded).toBe(0);
    expect(r.scores.u1.total).toBe(500); // inchangé
    expect(r.scores.u1.streak).toBe(0);
  });

  it("répondre vite rapporte plus que répondre tard", () => {
    const fast = scoreRound(mcq, { u: { choice: "a", serverTs: 0 } }, {}, 0, 0);
    const slow = scoreRound(
      mcq,
      { u: { choice: "a", serverTs: 20000 } },
      {},
      0,
      0,
    );
    expect(fast.scores.u.total).toBeGreaterThan(slow.scores.u.total);
  });

  it("ne score pas un sondage (correctChoice null, scores vides)", () => {
    const poll: Question = {
      id: "p",
      type: "poll",
      prompt: "Ton avis ?",
      timeLimitMs: 15000,
      options: [
        { id: "x", label: "X" },
        { id: "y", label: "Y" },
      ],
    };
    const r = scoreRound(poll, { u: { choice: "x" } }, {}, 0, STREAK_BONUS_PCT);
    expect(r.correctChoice).toBeNull();
    expect(Object.keys(r.scores)).toHaveLength(0);
    expect(Object.keys(r.reveals)).toHaveLength(0);
  });

  it("ne touche pas les joueurs sans réponse", () => {
    const r = scoreRound(
      mcq,
      { u1: { choice: "a", serverTs: 0 } },
      { u2: { total: 800, streak: 2 } },
      0,
      STREAK_BONUS_PCT,
    );
    expect(r.scores.u2).toBeUndefined();
  });
});

describe("eliminateAfterRound", () => {
  const players = ["u1", "u2", "u3", "u4"];

  it("élimine les mauvaises réponses ET les silencieux, garde les bons", () => {
    const fallen = eliminateAfterRound(
      mcq,
      { u1: { choice: "a" }, u2: { choice: "b" } }, // u3/u4 silencieux
      players,
      {},
    );
    expect(fallen.sort()).toEqual(["u2", "u3", "u4"]);
  });

  it("ne ré-élimine pas un joueur déjà hors course", () => {
    const fallen = eliminateAfterRound(mcq, {}, players, {
      u1: { total: 100, streak: 0, eliminated: true },
    });
    expect(fallen).not.toContain("u1");
    expect(fallen.sort()).toEqual(["u2", "u3", "u4"]);
  });

  it("un sondage n'élimine personne", () => {
    const poll: Question = {
      id: "p",
      type: "poll",
      prompt: "?",
      timeLimitMs: 10000,
      options: [
        { id: "x", label: "X" },
        { id: "y", label: "Y" },
      ],
    };
    expect(eliminateAfterRound(poll, {}, players, {})).toEqual([]);
  });
});
