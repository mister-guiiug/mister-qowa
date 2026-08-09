import { describe, it, expect } from "vitest";
import { parseQuizText, splitFields } from "./quizImport";
import { validateDraft } from "./quizDraft";

describe("splitFields", () => {
  it("découpe sur « ; » et respecte les guillemets", () => {
    expect(splitFields("a ; b ; c")).toEqual(["a", "b", "c"]);
    expect(splitFields('"a ; b" ; c')).toEqual(["a ; b", "c"]);
    // `""` à l'intérieur d'un champ entre guillemets = guillemet littéral.
    expect(splitFields('"il dit ""salut""" ; x')).toEqual([
      'il dit "salut"',
      "x",
    ]);
  });
});

describe("parseQuizText", () => {
  it("déduit les 4 types depuis les marqueurs", () => {
    const raw = [
      "# un commentaire ignoré",
      "Capitale de la France ; *Paris ; Lyon ; Marseille",
      "La Terre est plate ; F",
      "Plus grand océan ; =Pacifique ; =océan Pacifique",
      "Ta couleur préférée ; Rouge ; Bleu ; Vert",
      "",
    ].join("\n");
    const draft = parseQuizText(raw, "Géo");
    expect(draft.title).toBe("Géo");
    expect(draft.questions).toHaveLength(4);
    const mc = draft.questions[0]!;
    const tf = draft.questions[1]!;
    const ft = draft.questions[2]!;
    const poll = draft.questions[3]!;
    expect(mc.type).toBe("multiple_choice");
    expect(mc.options).toHaveLength(3);
    expect(mc.options.find((o) => o.id === mc.correctOptionId)?.label).toBe(
      "Paris",
    );
    expect(tf.type).toBe("true_false");
    expect(tf.correct).toBe(false);
    expect(ft.type).toBe("free_text");
    expect(ft.acceptedAnswers).toEqual(["Pacifique", "océan Pacifique"]);
    expect(poll.type).toBe("poll");
    expect(poll.options).toHaveLength(3);
  });

  it("produit un brouillon valide (validateDraft sans erreur)", () => {
    const draft = parseQuizText(
      "Capitale de l'Italie ; *Rome ; Milan ; Naples",
      "Quiz",
    );
    expect(validateDraft(draft)).toEqual([]);
  });

  it("ignore les lignes vides, commentaires et énoncés sans réponse", () => {
    const draft = parseQuizText(
      "# titre\n\nQuestion seule sans réponse\nVrai ou faux ? ; V",
      "T",
    );
    expect(draft.questions).toHaveLength(1);
    expect(draft.questions[0]!.type).toBe("true_false");
  });

  it("gère un « ; » échappé dans un énoncé", () => {
    const draft = parseQuizText('"Un, deux ; trois ?" ; *Oui ; Non', "T");
    expect(draft.questions[0]!.prompt).toBe("Un, deux ; trois ?");
    expect(draft.questions[0]!.options).toHaveLength(2);
  });
});
