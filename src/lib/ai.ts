/**
 * Génération de quiz par IA — 100 % côté client, clé fournie par l'utilisateur.
 *
 * Deux fournisseurs « browser-friendly » (CORS OK depuis une page web) :
 *  - Google Gemini (clé en query string, sortie JSON contrainte via responseSchema)
 *  - Anthropic (en-tête `anthropic-dangerous-direct-browser-access`, sortie via tool-use)
 *
 * Robustesse : timeout (AbortController) + 1 re-tentative sur erreur transitoire.
 * La sortie du modèle est toujours revalidée localement (zod + validateDraft),
 * `parseJsonLoose` servant de filet même quand la contrainte provider est posée.
 */
import { z } from "zod";
import type { AiProvider } from "../store/settingsStore";
import { effectiveModel } from "../store/settingsStore";
import { DEMO_QUIZZES } from "@shared/seed";
import {
  blankOption,
  blankQuestion,
  toDraft,
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
  /** Texte source : si fourni, les questions sont tirées de ce texte. */
  sourceText?: string;
}

const TIMEOUT_MS = 30_000;

const DIFFICULTY_GUIDE: Record<Difficulty, string> = {
  facile: "Questions accessibles au grand public, sans piège.",
  moyen: "Difficulté intermédiaire, quelques distracteurs plausibles.",
  difficile:
    "Questions exigeantes : nuances, distracteurs très plausibles, pièges conceptuels. " +
    "Évite les dates précises et chiffres obscurs (risque d'erreur factuelle) ; privilégie le raisonnement.",
};

/* ---------- schéma de la réponse attendue du modèle ---------- */

const aiQuestionSchema = z.object({
  type: z.enum(["multiple_choice", "true_false"]).default("multiple_choice"),
  prompt: z.string().min(1),
  options: z.array(z.string()).optional(),
  /** Index 0-based de la bonne réponse (multiple_choice). */
  correctIndex: z.number().int().nonnegative().optional(),
  /** Vrai/Faux : la proposition est-elle vraie ? */
  answer: z.boolean().optional(),
  /** Courte explication de la bonne réponse (montrée après la question). */
  explanation: z.string().optional(),
});

const aiQuizSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  questions: z.array(aiQuestionSchema).min(1),
});

export type AiQuiz = z.infer<typeof aiQuizSchema>;

/** Schéma JSON posé côté provider (Gemini responseSchema / Anthropic input_schema). */
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["multiple_choice", "true_false"] },
          prompt: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correctIndex: { type: "integer" },
          answer: { type: "boolean" },
          explanation: { type: "string" },
        },
        required: ["type", "prompt"],
      },
    },
  },
  required: ["title", "questions"],
} as const;

/* ---------- helpers purs (testés sans réseau) ---------- */

/** Parse du JSON « tolérant » : enlève les ```fences``` et isole le 1er objet. */
export function parseJsonLoose(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    /* on tente de nettoyer ci-dessous */
  }
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

/** Mappe une question IA validée en DraftQuestion (mêmes contraintes que l'éditeur). */
function aiQuestionToDraft(q: z.infer<typeof aiQuestionSchema>): DraftQuestion {
  const explanation = q.explanation?.trim()
    ? clamp(q.explanation, 300)
    : undefined;
  if (q.type === "true_false") {
    const base = blankQuestion("true_false");
    base.prompt = clamp(q.prompt, 300);
    base.correct = q.answer ?? true;
    base.explanation = explanation;
    return base;
  }
  const base = blankQuestion("multiple_choice");
  base.prompt = clamp(q.prompt, 300);
  base.explanation = explanation;
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
}

/** Convertit la sortie IA validée en brouillon éditable. */
export function aiQuizToDraft(ai: AiQuiz): DraftQuiz {
  return {
    id: crypto.randomUUID(),
    title: clamp(ai.title, 120),
    description: ai.description ? clamp(ai.description, 300) : "",
    questions: ai.questions.map(aiQuestionToDraft),
  };
}

function sourceOrTopic(p: GenParams): string[] {
  if (p.sourceText?.trim()) {
    return [
      "Base EXCLUSIVEMENT les questions sur le texte fourni ci-dessous, sans t'en écarter :",
      `"""${p.sourceText.trim().slice(0, 6000)}"""`,
    ];
  }
  return [`Sujet : « ${p.topic} ».`];
}

const SHAPE_EXAMPLE = `{
  "title": "titre court du quiz",
  "description": "une phrase de description",
  "questions": [
    { "type": "multiple_choice", "prompt": "…", "options": ["A","B","C","D"], "correctIndex": 0, "explanation": "…" },
    { "type": "true_false", "prompt": "…", "answer": true, "explanation": "…" }
  ]
}`;

/** Construit l'invite (français) qui force une sortie JSON stricte. */
export function buildPrompt(p: GenParams): string {
  const lang = p.language?.trim() || "français";
  return [
    `Tu es un générateur de quiz. Crée un quiz de ${p.count} questions en ${lang}.`,
    ...sourceOrTopic(p),
    `Difficulté : ${p.difficulty}. ${DIFFICULTY_GUIDE[p.difficulty]}`,
    "Mélange des questions à choix multiple (4 options, une seule bonne) et quelques Vrai/Faux.",
    "Les questions doivent être factuellement exactes et sans ambiguïté.",
    "",
    "Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, de la forme :",
    SHAPE_EXAMPLE,
    "Contraintes : prompt ≤ 300 caractères, chaque option ≤ 120 caractères,",
    "correctIndex est l'index 0-based dans options, exactement 4 options par QCM.",
    "Ajoute pour chaque question une `explanation` : 1 phrase (≤ 300 caractères)",
    "qui justifie la bonne réponse, montrée aux joueurs après la question.",
  ].join("\n");
}

/** Invite pour régénérer UNE seule question (en évitant des énoncés existants). */
function buildOnePrompt(p: GenParams, avoid: string[]): string {
  return [
    `Génère UNE seule question de quiz en ${p.language?.trim() || "français"}.`,
    ...sourceOrTopic(p),
    `Difficulté : ${p.difficulty}. ${DIFFICULTY_GUIDE[p.difficulty]}`,
    avoid.length
      ? `Évite de répéter ces énoncés : ${avoid.map((a) => `« ${a} »`).join(", ")}.`
      : "",
    "Réponds UNIQUEMENT avec un JSON de la forme " +
      `{ "title": "x", "questions": [ { "type": "multiple_choice", "prompt": "…", "options": ["A","B","C","D"], "correctIndex": 0 } ] } ` +
      "(exactement 1 question).",
  ]
    .filter(Boolean)
    .join("\n");
}

/* ---------- appels fournisseurs ---------- */

interface ProviderCfg {
  provider: AiProvider;
  apiKey: string;
  models: Partial<Record<AiProvider, string>>;
}

class ProviderHttpError extends Error {
  retryable: boolean;
  constructor(message: string, retryable: boolean) {
    super(message);
    this.retryable = retryable;
  }
}

async function callGemini(
  prompt: string,
  cfg: ProviderCfg,
  signal: AbortSignal,
): Promise<string> {
  const model = effectiveModel("gemini", cfg.models);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal,
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
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
  signal: AbortSignal,
): Promise<string> {
  const model = effectiveModel("anthropic", cfg.models);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal,
    headers: {
      "content-type": "application/json",
      "x-api-key": cfg.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      tools: [
        {
          name: "emit_quiz",
          description: "Émet le quiz généré au format structuré.",
          input_schema: RESPONSE_SCHEMA,
        },
      ],
      tool_choice: { type: "tool", name: "emit_quiz" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw await providerError(res, "Anthropic");
  const data = (await res.json()) as {
    content?: { type?: string; text?: string; input?: unknown }[];
  };
  const toolUse = data.content?.find((c) => c.type === "tool_use");
  if (toolUse?.input) return JSON.stringify(toolUse.input);
  // Repli : concatène le texte (si le modèle a ignoré l'outil).
  const text = data.content?.map((c) => c.text ?? "").join("");
  if (!text) throw new Error("Anthropic n'a renvoyé aucun contenu.");
  return text;
}

async function providerError(
  res: Response,
  name: string,
): Promise<ProviderHttpError> {
  let detail = "";
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    detail = body.error?.message ?? "";
  } catch {
    /* corps non-JSON */
  }
  if (res.status === 401 || res.status === 403) {
    return new ProviderHttpError(
      `Clé ${name} refusée (vérifie qu'elle est valide et active).`,
      false,
    );
  }
  if (res.status === 429) {
    return new ProviderHttpError(
      `Quota ${name} dépassé — réessaie plus tard.`,
      true,
    );
  }
  return new ProviderHttpError(
    `${name} a répondu ${res.status}${detail ? ` : ${detail}` : ""}.`,
    res.status >= 500,
  );
}

function isRetryable(e: unknown): boolean {
  if (e instanceof ProviderHttpError) return e.retryable;
  // AbortError (timeout) ou TypeError (réseau/CORS, fetch rejette sans Response).
  if (e instanceof DOMException && e.name === "AbortError") return true;
  if (e instanceof TypeError) return true;
  return false;
}

function friendly(e: unknown): Error {
  if (e instanceof DOMException && e.name === "AbortError") {
    return new Error("La génération a expiré — réessaie.");
  }
  if (e instanceof TypeError) {
    return new Error("Connexion au fournisseur impossible (réseau ou CORS).");
  }
  return e instanceof Error ? e : new Error(String(e));
}

/** Appel provider avec timeout + 1 re-tentative sur erreur transitoire. */
async function callWithRetry(
  prompt: string,
  cfg: ProviderCfg,
): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      return cfg.provider === "gemini"
        ? await callGemini(prompt, cfg, ctrl.signal)
        : await callAnthropic(prompt, cfg, ctrl.signal);
    } catch (e) {
      lastError = e;
      if (attempt === 1 || !isRetryable(e)) throw friendly(e);
    } finally {
      clearTimeout(timer);
    }
  }
  throw friendly(lastError);
}

/* ---------- API publique ---------- */

/** Génère un quiz : appel fournisseur → parse → validation → DraftQuiz prêt à éditer. */
export async function generateQuiz(
  params: GenParams,
  cfg: ProviderCfg,
): Promise<DraftQuiz> {
  if (!cfg.apiKey.trim()) throw new Error("Renseigne d'abord ta clé API.");
  const raw = await callWithRetry(buildPrompt(params), cfg);
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

/** Régénère UNE question (pour l'écran d'aperçu). */
export async function generateOneQuestion(
  params: GenParams,
  cfg: ProviderCfg,
  avoidPrompts: string[],
): Promise<DraftQuestion> {
  if (!cfg.apiKey.trim()) throw new Error("Renseigne d'abord ta clé API.");
  const raw = await callWithRetry(buildOnePrompt(params, avoidPrompts), cfg);
  const parsed = aiQuizSchema.safeParse(parseJsonLoose(raw));
  if (!parsed.success || parsed.data.questions.length === 0) {
    throw new Error("Régénération impossible — réessaie.");
  }
  const draft = aiQuizToDraft({
    title: "x",
    questions: [parsed.data.questions[0]],
  });
  return draft.questions[0];
}

/** Brouillon de DÉMONSTRATION (sans clé) : réutilise un quiz seed, titre honnête. */
export function demoDraft(topic: string): DraftQuiz {
  const base = toDraft(DEMO_QUIZZES[0]);
  return {
    ...base,
    id: crypto.randomUUID(),
    title: `Démo — ${topic.trim() || base.title}`,
  };
}
