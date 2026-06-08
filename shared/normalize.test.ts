import { describe, it, expect } from "vitest";
import { normalizeFreeText, freeTextMatches } from "./normalize";

describe("normalizeFreeText", () => {
  it("retire accents, casse et espaces superflus", () => {
    expect(normalizeFreeText("  Café  Crème ")).toBe("cafe creme");
  });

  it("respecte caseSensitive", () => {
    expect(normalizeFreeText("Paris", true)).toBe("Paris");
    expect(normalizeFreeText("Paris", false)).toBe("paris");
  });
});

describe("freeTextMatches", () => {
  it("matche malgré accents/casse", () => {
    expect(freeTextMatches("ELEPHANT", ["éléphant"])).toBe(true);
  });
  it("respecte caseSensitive", () => {
    expect(freeTextMatches("paris", ["Paris"], true)).toBe(false);
    expect(freeTextMatches("Paris", ["Paris"], true)).toBe(true);
  });
  it("rejette une mauvaise réponse", () => {
    expect(freeTextMatches("Lyon", ["Paris", "paname"])).toBe(false);
  });
});
