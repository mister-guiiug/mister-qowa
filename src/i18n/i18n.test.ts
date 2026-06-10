import { describe, it, expect } from "vitest";
import { fr } from "./fr";
import { en } from "./en";
import type { Msg, Vars } from "./types";

const render = (m: Msg, v: Vars) => (typeof m === "function" ? m(v) : m);

describe("i18n", () => {
  it("EN a exactement les mêmes clés que FR (parité)", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(fr).sort());
  });

  it("aucune valeur vide", () => {
    for (const [key, msg] of Object.entries(fr)) {
      const out = render(msg as Msg, { n: 1, total: 5, pseudo: "x" });
      expect(out, `fr[${key}]`).toBeTruthy();
    }
  });

  it("interpolation des variables", () => {
    expect(render(fr["common.questionN"], { n: 2, total: 5 })).toBe(
      "Question 2/5",
    );
    expect(render(en["common.questionN"], { n: 2, total: 5 })).toBe(
      "Question 2/5",
    );
  });

  it("pluriels FR (s) et EN", () => {
    expect(render(fr["create.questionsCount"], { n: 1 })).toBe("1 question");
    expect(render(fr["create.questionsCount"], { n: 3 })).toBe("3 questions");
    expect(render(en["create.questionsCount"], { n: 1 })).toBe("1 question");
    expect(render(en["create.questionsCount"], { n: 3 })).toBe("3 questions");
  });

  it("ordinal EN (1st/2nd/3rd/4th)", () => {
    expect(render(en["common.ordinal"], { n: 1 })).toBe("1st");
    expect(render(en["common.ordinal"], { n: 2 })).toBe("2nd");
    expect(render(en["common.ordinal"], { n: 3 })).toBe("3rd");
    expect(render(en["common.ordinal"], { n: 4 })).toBe("4th");
  });
});
