import { describe, it, expect } from "vitest";
import { resultsCsv, hardestQuestion, type GameResult } from "./results";

const base: GameResult = {
  id: "r1",
  sessionId: "s1",
  hostUid: "h",
  quizId: "q",
  quizTitle: "Test",
  finishedAt: 0,
  playerCount: 2,
  ranking: [
    { uid: "u1", pseudo: "Alex", total: 1200, avatar: "🦊" },
    { uid: "u2", pseudo: 'Bo"b', total: 800 },
  ],
  questionStats: [
    { index: 0, prompt: "Facile ?", answered: 2, correct: 2 },
    { index: 1, prompt: "Dure ?", answered: 2, correct: 0 },
  ],
};

describe("resultsCsv", () => {
  it("inclut rang, pseudo, avatar et score (avec échappement)", () => {
    const csv = resultsCsv(base);
    expect(csv).toContain("rang,pseudo,avatar,score");
    expect(csv).toContain('1,"Alex","🦊",1200');
    expect(csv).toContain('2,"Bo""b","",800'); // guillemet échappé
  });

  it("ajoute le bloc de réussite par question", () => {
    const csv = resultsCsv(base);
    expect(csv).toContain("question,enonce,reussite");
    expect(csv).toContain('1,"Facile ?",100%');
    expect(csv).toContain('2,"Dure ?",0%');
  });

  it("omet le bloc stats quand absent", () => {
    const csv = resultsCsv({ ...base, questionStats: undefined });
    expect(csv).not.toContain("reussite");
  });
});

describe("hardestQuestion", () => {
  it("renvoie la question au plus faible taux de réussite", () => {
    expect(hardestQuestion(base)?.index).toBe(1);
  });

  it("ignore les questions sans réponse et renvoie null si vide", () => {
    expect(hardestQuestion({ ...base, questionStats: [] })).toBeNull();
    expect(
      hardestQuestion({
        ...base,
        questionStats: [{ index: 0, prompt: "x", answered: 0, correct: 0 }],
      }),
    ).toBeNull();
  });
});
