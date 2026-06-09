import { describe, it, expect } from "vitest";
import {
  parseJsonLoose,
  aiQuizToDraft,
  buildPrompt,
  demoDraft,
  type AiQuiz,
} from "./ai";
import { validateDraft } from "./quizDraft";

describe("parseJsonLoose", () => {
  it("parse du JSON nu", () => {
    expect(parseJsonLoose('{"a":1}')).toEqual({ a: 1 });
  });

  it("retire les fences ```json", () => {
    expect(parseJsonLoose('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("isole l'objet au milieu de texte parasite", () => {
    expect(parseJsonLoose('Voici le quiz : {"a":1} merci !')).toEqual({ a: 1 });
  });

  it("lève si aucun JSON", () => {
    expect(() => parseJsonLoose("désolé")).toThrow();
  });
});

describe("aiQuizToDraft", () => {
  const ai: AiQuiz = {
    title: "Capitales",
    description: "Géo express",
    questions: [
      {
        type: "multiple_choice",
        prompt: "Capitale de la France ?",
        options: ["Paris", "Lyon", "Marseille", "Nice"],
        correctIndex: 0,
      },
      { type: "true_false", prompt: "Berlin est en Allemagne.", answer: true },
    ],
  };

  it("produit un brouillon valide", () => {
    const draft = aiQuizToDraft(ai);
    expect(validateDraft(draft)).toEqual([]);
    expect(draft.title).toBe("Capitales");
    expect(draft.questions).toHaveLength(2);
  });

  it("relie correctOptionId à l'option d'index correctIndex", () => {
    const draft = aiQuizToDraft(ai);
    const q0 = draft.questions[0];
    expect(q0.type).toBe("multiple_choice");
    expect(q0.correctOptionId).toBe(q0.options[0].id);
    expect(q0.options.map((o) => o.label)).toEqual([
      "Paris",
      "Lyon",
      "Marseille",
      "Nice",
    ]);
  });

  it("mappe le Vrai/Faux", () => {
    const draft = aiQuizToDraft(ai);
    expect(draft.questions[1].type).toBe("true_false");
    expect(draft.questions[1].correct).toBe(true);
  });

  it("borne un correctIndex hors limites à 0", () => {
    const draft = aiQuizToDraft({
      title: "T",
      questions: [
        {
          type: "multiple_choice",
          prompt: "Q ?",
          options: ["a", "b"],
          correctIndex: 9,
        },
      ],
    });
    expect(draft.questions[0].correctOptionId).toBe(
      draft.questions[0].options[0].id,
    );
    expect(validateDraft(draft)).toEqual([]);
  });

  it("tronque les options trop longues à 120 caractères", () => {
    const long = "x".repeat(200);
    const draft = aiQuizToDraft({
      title: "T",
      questions: [
        {
          type: "multiple_choice",
          prompt: "Q ?",
          options: [long, "b"],
          correctIndex: 0,
        },
      ],
    });
    expect(draft.questions[0].options[0].label.length).toBe(120);
    expect(validateDraft(draft)).toEqual([]);
  });
});

describe("buildPrompt", () => {
  it("intègre sujet, nombre et difficulté", () => {
    const p = buildPrompt({
      topic: "Le jazz",
      count: 7,
      difficulty: "difficile",
    });
    expect(p).toContain("Le jazz");
    expect(p).toContain("7 questions");
    expect(p).toContain("difficile");
    expect(p).toContain("JSON");
  });

  it("utilise le texte source quand fourni (plutôt que le sujet)", () => {
    const p = buildPrompt({
      topic: "ignoré",
      count: 3,
      difficulty: "facile",
      sourceText: "La photosynthèse transforme la lumière en énergie.",
    });
    expect(p).toContain("photosynthèse");
    expect(p).toContain("Base EXCLUSIVEMENT");
    expect(p).not.toContain("« ignoré »");
  });

  it("intègre la langue demandée", () => {
    const p = buildPrompt({
      topic: "x",
      count: 3,
      difficulty: "moyen",
      language: "anglais",
    });
    expect(p).toContain("anglais");
  });
});

describe("demoDraft", () => {
  it("produit un brouillon valide au titre honnête", () => {
    const d = demoDraft("Volcans");
    expect(validateDraft(d)).toEqual([]);
    expect(d.title).toContain("Démo —");
    expect(d.title).toContain("Volcans");
    expect(d.questions.length).toBeGreaterThan(0);
  });
});
