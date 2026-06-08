/**
 * Génération de quiz par IA — 100 % côté client, clé fournie par l'utilisateur.
 *
 * Deux fournisseurs « browser-friendly » (CORS OK depuis une page web) :
 *  - Google Gemini (clé en query string)
 *  - Anthropic (en-tête `anthropic-dangerous-direct-browser-access`)
 *
 * La sortie du modèle (JSON libre) est revalidée localement, puis convertie en
 * `DraftQuiz` réutilisant les mêmes garde-fous que l'éditeur (`validateDraft`).
 */
import { z } from "zod";
import type { AiProvider } from "../store/settingsStore";
import { effectiveModel } from "../store/settingsStore";
import {
  blankOption,
  blankQuestion,
  validateDraft,
  type DraftQuestion,
  type DraftQuiz,
} from "./quizDraft";

export type Difficulty = "facile" | "moyen" | "difficile";

export interface GenParams {
  topic: string;
  count: number;
  difficulty: Difficulty;
  /** Langue des questions (défaut : français). */
  language?: string;
}

/* ---------- schéma de la réponse attendue du modèle ---------- */

const aiQuestionSchema = z.object({
  type: z.enum(["multiple_choice", "true_false"]).default("multiple_choice"),
  prompt: z.string().min(1),
  options: z.array(z.string()).optional(),
  /** Index 0-based de la bonne réponse (multiple_choice). */
  correctIndex: z.number().int().nonnegative().optional(),
  /** Vrai/Faux : la proposition est-elle vraie ? */
  answer: z.boolean().optional(),
});

const aiQuizSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(aiQuestionSchema).min(1),
});

export type AiQuiz = z.infer<typeof aiQuizSchema>;

/* ---------- helpers purs (testés sans réseau) ---------- */

/** Parse du JSON « tolérant » : enlève les ```fences``` et isole le 1er objet. */
export function parseJsonLoose(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    /* on tente de nettoyer ci-dessous */
  }
  // Retire un éventuel bloc ```json ... ```
  const fenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    return JSON.parse(fenced);
  } catch {
    /* dernier recours : sous-chaîne {...} */
  }
  const start = fenced.indexOf("{");
  const end = fenced.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return JSON.parse(fenced.slice(start, end + 1));
  }
  throw new Error("Réponse IA illisible (JSON introuvable).");
}

const clamp = (s: string, max: number) => s.trim().slice(0, max);

/** Convertit la sortie IA validée en brouillon éditable (mêmes contraintes que l'éditeur). */
export function aiQuizToDraft(ai: AiQuiz): DraftQuiz {
  const questions: DraftQuestion[] = ai.questions.map((q) => {
    if (q.type === "true_false") {
      const base = blankQuestion("true_false");
      base.prompt = clamp(q.prompt, 300);
      base.correct = q.answer ?? true;
      return base;
    }
    const base = blankQuestion("multiple_choice");
    base.prompt = clamp(q.prompt, 300);
    const labels = (q.options ?? [])
      .map((o) => clamp(String(o), 120))
      .filter(Boolean)
      .slice(0, 4);
    base.options = (labels.length >= 2 ? labels : ["Vrai", "Faux"]).map((l) =>
      blankOption(l),
    );
    const idx =
      q.correctIndex != null && q.correctIndex < base.options.length
        ? q.correctIndex
        : 0;
    base.correctOptionId = base.options[idx].id;
    return base;
  });

  return {
    id: crypto.randomUUID(),
    title: clamp(ai.title, 120),
    description: ai.description ? clamp(ai.description, 300) : "",
    questions,
  };
}

/** Construit l'invite (français) qui force une sortie JSON stricte. */
export function buildPrompt(p: GenParams): string {
  const lang = p.language?.trim() || "français";
  return [
    `Tu es un générateur de quiz. Crée un quiz de ${p.count} questions en ${lang}.`,
    `Sujet : « ${p.topic} ». Difficulté : ${p.difficulty}.`,
    "Mélange des questions à choix multiple (4 options, une seule bonne) et quelques Vrai/Faux.",
    "Les questions doivent être factuellement exactes et sans ambiguïté.",
    "",
    "Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, de la forme :",
    `{
  "title": "titre court du quiz",
  "description": "une phrase de description",
  "questions": [
    { "type": "multiple_choice", "prompt": "…", "options": ["A","B","C","D"], "correctIndex": 0 },
    { "type": "true_false", "prompt": "…", "answer": true }
  ]
}`,
    "Contraintes : prompt ≤ 300 caractères, chaque option ≤ 120 caractères,",
    "correctIndex est l'index 0-based dans options, exactement 4 options par QCM.",
  ].join("\n");
}

/* ---------- appels fournisseurs ---------- */

interface ProviderCfg {
  provider: AiProvider;
  apiKey: string;
  models: Partial<Record<AiProvider, string>>;
}

async function callGemini(prompt: string, cfg: ProviderCfg): Promise<string> {
  const model = effectiveModel("gemini", cfg.models);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!res.ok) throw await providerError(res, "Gemini");
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini n'a renvoyé aucun contenu.");
  return text;
}

async function callAnthropic(
  prompt: string,
  cfg: ProviderCfg,
): Promise<string> {
  const model = effectiveModel("anthropic", cfg.models);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": cfg.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw await providerError(res, "Anthropic");
  const data = (await res.json()) as { content?: { text?: string }[] };
  const text = data.content?.map((c) => c.text ?? "").join("");
  if (!text) throw new Error("Anthropic n'a renvoyé aucun contenu.");
  return text;
}

async function providerError(res: Response, name: string): Promise<Error> {
  let detail = "";
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    detail = body.error?.message ?? "";
  } catch {
    /* corps non-JSON */
  }
  if (res.status === 401 || res.status === 403) {
    return new Error(
      `Clé ${name} refusée (vérifie qu'elle est valide et active).`,
    );
  }
  if (res.status === 429) {
    return new Error(`Quota ${name} dépassé — réessaie plus tard.`);
  }
  return new Error(
    `${name} a répondu ${res.status}${detail ? ` : ${detail}` : ""}.`,
  );
}

/** Génère un quiz : appel fournisseur → parse → validation → DraftQuiz prêt à éditer. */
export async function generateQuiz(
  params: GenParams,
  cfg: ProviderCfg,
): Promise<DraftQuiz> {
  if (!cfg.apiKey.trim()) throw new Error("Renseigne d'abord ta clé API.");
  const prompt = buildPrompt(params);
  const raw =
    cfg.provider === "gemini"
      ? await callGemini(prompt, cfg)
      : await callAnthropic(prompt, cfg);

  const parsed = aiQuizSchema.safeParse(parseJsonLoose(raw));
  if (!parsed.success) {
    throw new Error("L'IA a produit un quiz au mauvais format — réessaie.");
  }
  const draft = aiQuizToDraft(parsed.data);
  const errs = validateDraft(draft);
  if (errs.length > 0) {
    throw new Error(`Quiz généré invalide : ${errs[0]}`);
  }
  return draft;
}
