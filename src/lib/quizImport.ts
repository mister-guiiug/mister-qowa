/**
 * Import de quiz depuis du TEXTE (sans IA, sans clé). Parseur PUR : une question
 * par ligne, champs séparés par « ; » (guillemets pour échapper un « ; » ou un
 * guillemet, façon CSV — `""` = guillemet littéral). Lignes vides et lignes
 * commençant par `#` ignorées. Le type est déduit des marqueurs :
 *
 *   - `Énoncé ; *Bonne ; Mauvaise ; Mauvaise`   → multiple_choice (`*` = bonne)
 *   - `Énoncé ; V`  /  `Énoncé ; F`             → true_false
 *   - `Énoncé ; =réponse ; =autre réponse`      → free_text (`=` = acceptée)
 *   - `Énoncé ; Option A ; Option B`            → poll (aucun marqueur)
 *
 * Produit un DraftQuiz réutilisé par l'éditeur (saveDraft → /create/new).
 */
import {
  type DraftQuiz,
  type DraftQuestion,
  blankQuestion,
  blankOption,
} from "./quizDraft";

/** Découpe une ligne en champs (séparateur « ; », guillemets CSV). */
export function splitFields(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ";") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((f) => f.trim());
}

/** Valeurs vrai/faux reconnues (multilingue de base). */
const TRUE_FALSE: Record<string, boolean> = {
  v: true,
  vrai: true,
  true: true,
  t: true,
  wahr: true,
  vero: true,
  verdadero: true,
  f: false,
  faux: false,
  false: false,
  falsch: false,
  falso: false,
};

/** Construit une question de brouillon à partir d'un énoncé + ses champs. */
function buildQuestion(
  prompt: string,
  answers: string[],
): DraftQuestion | null {
  // free_text : au moins un champ préfixé « = ».
  const accepted = answers
    .filter((a) => a.startsWith("="))
    .map((a) => a.slice(1).trim())
    .filter(Boolean);
  if (accepted.length) {
    const q = blankQuestion("free_text");
    q.prompt = prompt;
    q.acceptedAnswers = accepted;
    return q;
  }

  // true_false : un seul champ vrai/faux.
  const only = answers.length === 1 ? answers[0]?.toLowerCase() : undefined;
  if (only && only in TRUE_FALSE) {
    const q = blankQuestion("true_false");
    q.prompt = prompt;
    q.correct = TRUE_FALSE[only] ?? false;
    return q;
  }

  // multiple_choice : un champ préfixé « * » marque la bonne réponse.
  const starred = answers.findIndex((a) => a.startsWith("*"));
  if (starred >= 0) {
    const opts = answers.map((a) =>
      blankOption((a.startsWith("*") ? a.slice(1) : a).trim()),
    );
    const q = blankQuestion("multiple_choice");
    q.prompt = prompt;
    q.options = opts;
    q.correctOptionId = opts[starred]!.id;
    return q;
  }

  // sinon : ≥ 2 options sans marqueur = sondage.
  if (answers.length >= 2) {
    const q = blankQuestion("poll");
    q.prompt = prompt;
    q.options = answers.map((a) => blankOption(a));
    return q;
  }

  return null; // indéterminable (énoncé sans réponse exploitable)
}

/** Parse un texte en DraftQuiz (questions ignorées si non interprétables). */
export function parseQuizText(raw: string, title: string): DraftQuiz {
  const questions: DraftQuestion[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const fields = splitFields(trimmed);
    const prompt = fields[0] ?? "";
    const answers = fields.slice(1).filter((f) => f.length > 0);
    if (!prompt || answers.length === 0) continue;
    const q = buildQuestion(prompt, answers);
    if (q) questions.push(q);
  }
  return {
    id: crypto.randomUUID(),
    title: title.trim() || "Quiz",
    description: "",
    questions,
  };
}
