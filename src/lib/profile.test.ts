import { describe, it, expect } from "vitest";
import { applyGameResult, emptyProfile, BADGES } from "./profile";

describe("applyGameResult", () => {
  it("compte une 1re partie et débloque le badge firstGame", () => {
    const p = applyGameResult(emptyProfile(), {
      sessionId: "s1",
      rank: 4,
      points: 1200,
    });
    expect(p.gamesPlayed).toBe(1);
    expect(p.totalPoints).toBe(1200);
    expect(p.bestRank).toBe(4);
    expect(p.badges).toContain(BADGES.firstGame);
    expect(p.badges).not.toContain(BADGES.podium);
  });

  it("est idempotent par sessionId (anti double-comptage au PODIUM)", () => {
    const once = applyGameResult(emptyProfile(), {
      sessionId: "s1",
      rank: 1,
      points: 1000,
    });
    const twice = applyGameResult(once, {
      sessionId: "s1",
      rank: 1,
      points: 1000,
    });
    expect(twice).toBe(once); // même référence : aucun changement
    expect(twice.gamesPlayed).toBe(1);
    expect(twice.totalPoints).toBe(1000);
  });

  it("débloque podium (top 3) et victoire (1er)", () => {
    const podium = applyGameResult(emptyProfile(), {
      sessionId: "s1",
      rank: 3,
      points: 500,
    });
    expect(podium.badges).toContain(BADGES.podium);
    expect(podium.badges).not.toContain(BADGES.win);

    const win = applyGameResult(podium, {
      sessionId: "s2",
      rank: 1,
      points: 900,
    });
    expect(win.badges).toContain(BADGES.win);
    expect(win.bestRank).toBe(1);
  });

  it("cumule les points et retient le meilleur rang", () => {
    let p = emptyProfile();
    p = applyGameResult(p, { sessionId: "a", rank: 5, points: 300 });
    p = applyGameResult(p, { sessionId: "b", rank: 2, points: 700 });
    expect(p.gamesPlayed).toBe(2);
    expect(p.totalPoints).toBe(1000);
    expect(p.bestRank).toBe(2);
  });

  it("débloque veteran à 5 parties et borne la liste de dédup", () => {
    let p = emptyProfile();
    for (let i = 0; i < 60; i += 1) {
      p = applyGameResult(p, { sessionId: `s${i}`, rank: 2, points: 100 });
    }
    expect(p.gamesPlayed).toBe(60);
    expect(p.badges).toContain(BADGES.veteran);
    expect(p.counted.length).toBeLessThanOrEqual(50);
    // Les sessions récentes restent dédupliquées.
    const again = applyGameResult(p, {
      sessionId: "s59",
      rank: 2,
      points: 100,
    });
    expect(again.gamesPlayed).toBe(60);
  });

  it("ignore des points négatifs (clamp à 0)", () => {
    const p = applyGameResult(emptyProfile(), {
      sessionId: "s1",
      rank: 9,
      points: -50,
    });
    expect(p.totalPoints).toBe(0);
  });
});
