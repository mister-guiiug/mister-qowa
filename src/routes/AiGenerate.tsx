import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  KeyRound,
  ExternalLink,
  RefreshCw,
  Pencil,
  Check,
} from "lucide-react";
import { Screen, Button, Card, Spinner } from "../lib/ui";
import {
  useAiSettings,
  effectiveModel,
  DEFAULT_MODELS,
  KEY_HELP,
  type AiProvider,
} from "../store/settingsStore";
import {
  generateQuiz,
  generateOneQuestion,
  demoDraft,
  type Difficulty,
  type GenParams,
} from "../lib/ai";
import type { DraftQuestion, DraftQuiz } from "../lib/quizDraft";
import { saveDraft } from "../lib/draft";
import { errMsg } from "../lib/err";

const field =
  "rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/15 focus:ring-brand";

const PROVIDERS: { id: AiProvider; label: string }[] = [
  { id: "gemini", label: "Google Gemini" },
  { id: "anthropic", label: "Anthropic Claude" },
];
const DIFFICULTIES: Difficulty[] = ["facile", "moyen", "difficile"];
const LANGUAGES = ["français", "anglais", "espagnol", "allemand", "italien"];

function correctLabel(q: DraftQuestion): string {
  if (q.type === "true_false") return q.correct ? "Vrai" : "Faux";
  if (q.type === "multiple_choice")
    return q.options.find((o) => o.id === q.correctOptionId)?.label ?? "—";
  return "—";
}

export function AiGenerate() {
  const nav = useNavigate();
  const provider = useAiSettings((s) => s.provider);
  const keys = useAiSettings((s) => s.keys);
  const models = useAiSettings((s) => s.models);
  const setProvider = useAiSettings((s) => s.setProvider);
  const setKey = useAiSettings((s) => s.setKey);
  const setModel = useAiSettings((s) => s.setModel);

  const [topic, setTopic] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("moyen");
  const [language, setLanguage] = useState("français");
  const [busy, setBusy] = useState(false);
  const [regenIndex, setRegenIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<DraftQuiz | null>(null);

  const apiKey = keys[provider] ?? "";
  const params: GenParams = { topic, count, difficulty, language, sourceText };
  const cfg = { provider, apiKey, models };

  async function generate() {
    setError(null);
    if (!topic.trim() && !sourceText.trim()) {
      setError("Indique un sujet ou colle un texte source.");
      return;
    }
    if (!apiKey.trim()) {
      setError("Renseigne ta clé API plus bas.");
      return;
    }
    setBusy(true);
    try {
      setPreview(await generateQuiz(params, cfg));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  function tryDemo() {
    setError(null);
    setPreview(demoDraft(topic));
  }

  async function regenerate(index: number) {
    if (!preview) return;
    setError(null);
    setRegenIndex(index);
    try {
      const avoid = preview.questions
        .filter((_, i) => i !== index)
        .map((q) => q.prompt);
      const fresh = await generateOneQuestion(params, cfg, avoid);
      setPreview({
        ...preview,
        questions: preview.questions.map((q, i) => (i === index ? fresh : q)),
      });
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setRegenIndex(null);
    }
  }

  function openInEditor() {
    if (!preview) return;
    saveDraft(preview);
    nav("/create/new");
  }

  /* ---------- écran d'aperçu ---------- */
  if (preview) {
    return (
      <Screen>
        <button
          type="button"
          onClick={() => setPreview(null)}
          className="mb-4 inline-flex items-center gap-1 self-start text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft className="size-4" /> Modifier les paramètres
        </button>
        <h1 className="font-display text-3xl">{preview.title}</h1>
        <p className="mt-1 text-sm text-white/60">
          {preview.questions.length} question
          {preview.questions.length > 1 ? "s" : ""} — relis puis ouvre dans
          l’éditeur.
        </p>

        {error ? (
          <p className="mt-4 rounded-xl bg-rose-500/20 px-4 py-2 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-3">
          {preview.questions.map((q, i) => (
            <Card key={q.id} className="flex flex-col gap-1">
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">
                  {i + 1}. {q.prompt}
                </p>
                <Button
                  variant="ghost"
                  onClick={() => void regenerate(i)}
                  disabled={regenIndex !== null}
                  aria-label={`Régénérer la question ${i + 1}`}
                  className="shrink-0 px-3 py-2"
                >
                  <RefreshCw
                    className={`size-4 ${regenIndex === i ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
              <p className="inline-flex items-center gap-1 text-sm text-answer-green">
                <Check className="size-4" /> {correctLabel(q)}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <Button full onClick={openInEditor}>
            <Pencil className="size-5" /> Ouvrir dans l’éditeur
          </Button>
        </div>
      </Screen>
    );
  }

  /* ---------- écran de paramètres ---------- */
  return (
    <Screen>
      <button
        type="button"
        onClick={() => nav("/create")}
        className="mb-4 inline-flex items-center gap-1 self-start text-sm text-white/60 hover:text-white"
      >
        <ArrowLeft className="size-4" /> Retour
      </button>

      <h1 className="flex items-center gap-2 font-display text-3xl">
        <Sparkles className="size-7 text-brand" /> Générer par IA
      </h1>
      <p className="mt-2 text-sm text-white/60">
        Décris un sujet (ou colle un texte). L’IA propose un quiz que tu pourras
        relire et modifier avant de l’enregistrer.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-white/60">Sujet</span>
          <input
            value={topic}
            maxLength={200}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex : la mythologie grecque, les capitales d'Europe…"
            aria-label="Sujet du quiz"
            className={field}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-white/60">
            …ou à partir d’un texte (optionnel)
          </span>
          <textarea
            value={sourceText}
            maxLength={6000}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Colle ici un cours, un article, un résumé…"
            aria-label="Texte source"
            rows={4}
            className={`${field} resize-y`}
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-sm text-white/60">Questions</span>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              aria-label="Nombre de questions"
              className={field}
            >
              {[3, 5, 8, 10].map((n) => (
                <option key={n} value={n} className="bg-[#1a1230]">
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-sm text-white/60">Difficulté</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              aria-label="Difficulté"
              className={`${field} capitalize`}
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d} className="bg-[#1a1230] capitalize">
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-sm text-white/60">Langue</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Langue"
              className={`${field} capitalize`}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l} className="bg-[#1a1230] capitalize">
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-rose-500/20 px-4 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-2">
        <Button full onClick={generate} disabled={busy}>
          <Sparkles className="size-5" /> Générer le quiz
        </Button>
        <Button full variant="ghost" onClick={tryDemo} disabled={busy}>
          Essayer en mode démo (sans clé)
        </Button>
      </div>

      {busy ? <Spinner label="Génération en cours…" /> : null}

      <Card className="mt-8 flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-white/50">
          <KeyRound className="size-4" /> Ta clé API
        </h2>

        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProvider(p.id)}
              aria-pressed={provider === p.id}
              className={`rounded-xl px-3 py-1.5 text-sm ring-1 transition ${
                provider === p.id
                  ? "bg-brand text-white ring-brand"
                  : "bg-white/5 text-white/70 ring-white/15 hover:bg-white/10"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <input
          type="password"
          value={apiKey}
          onChange={(e) => setKey(provider, e.target.value)}
          placeholder={`Clé ${provider === "gemini" ? "Gemini" : "Anthropic"}`}
          aria-label="Clé API"
          autoComplete="off"
          className={field}
        />
        <input
          value={models[provider] ?? ""}
          onChange={(e) => setModel(provider, e.target.value)}
          placeholder={`Modèle (défaut : ${DEFAULT_MODELS[provider]})`}
          aria-label="Modèle (optionnel)"
          className={`${field} text-sm`}
        />

        <p className="text-xs text-white/40">
          Modèle utilisé : {effectiveModel(provider, models)}. La clé reste dans
          ton navigateur (jamais envoyée à nos serveurs) et part directement
          chez {provider === "gemini" ? "Google" : "Anthropic"}.
        </p>
        <a
          href={KEY_HELP[provider].url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
        >
          Obtenir une clé — {KEY_HELP[provider].label}
          <ExternalLink className="size-3" />
        </a>
      </Card>
    </Screen>
  );
}
