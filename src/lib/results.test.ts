import { describe, it, expect } from "vitest";
import { parseCsv } from "@mister-guiiug/dev-wpa-config/csv";
import {
  resultsCsv,
  hardestQuestion,
  aggregateByQuiz,
  type GameResult,
} from "./results";

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
  // Depuis l'adoption du socle, les guillemets ne sont posés que là où
  // RFC 4180 l'exige (l'ancien csvCell maison guillemetait tout).
  it("inclut rang, pseudo, avatar et score (avec échappement)", () => {
    const csv = resultsCsv(base);
    expect(csv).toContain("rang,pseudo,avatar,score");
    expect(csv).toContain("1,Alex,🦊,1200");
    expect(csv).toContain('2,"Bo""b",,800'); // guillemet doublé, pas échappé
  });

  it("relit les mêmes cellules après un aller-retour parseCsv", () => {
    const rows = parseCsv(resultsCsv(base));
    expect(rows[1]).toEqual(["1", "Alex", "🦊", "1200"]);
    expect(rows[2]).toEqual(["2", 'Bo"b', "", "800"]);
  });

  it("ajoute le bloc de réussite par question", () => {
    const csv = resultsCsv(base);
    expect(csv).toContain("question,enonce,reussite");
    expect(csv).toContain("1,Facile ?,100%");
    expect(csv).toContain("2,Dure ?,0%");
  });

  it("omet le bloc stats quand absent", () => {
    const csv = resultsCsv({ ...base, questionStats: undefined });
    expect(csv).not.toContain("reussite");
  });
});

describe("aggregateByQuiz", () => {
  it("agrège parties, moyenne et record par quiz", () => {
    const second: GameResult = {
      ...base,
      id: "r2",
      sessionId: "s2",
      ranking: [{ uid: "u3", pseudo: "Chris", total: 400 }],
    };
    const aggs = aggregateByQuiz([base, second]);
    expect(aggs).toHaveLength(1);
    expect(aggs[0]!.games).toBe(2);
    expect(aggs[0]!.avgScore).toBe(Math.round((1200 + 800 + 400) / 3));
    expect(aggs[0]!.bestScore).toBe(1200);
  });

  it("sépare les quiz différents et trie par nombre de parties", () => {
    const other: GameResult = {
      ...base,
      id: "r3",
      quizId: "autre",
      quizTitle: "Autre",
    };
    const aggs = aggregateByQuiz([base, { ...base, id: "r2" }, other]);
    expect(aggs.map((a) => a.quizTitle)).toEqual(["Test", "Autre"]);
    expect(aggs[0]!.games).toBe(2);
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
