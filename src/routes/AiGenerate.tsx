import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, KeyRound, ExternalLink } from "lucide-react";
import { Screen, Button, Card, Spinner } from "../lib/ui";
import {
  useAiSettings,
  effectiveModel,
  DEFAULT_MODELS,
  KEY_HELP,
  type AiProvider,
} from "../store/settingsStore";
import { generateQuiz, type Difficulty } from "../lib/ai";
import { saveDraft } from "../lib/draft";
import { errMsg } from "../lib/err";

const field =
  "rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/15 focus:ring-brand";

const PROVIDERS: { id: AiProvider; label: string }[] = [
  { id: "gemini", label: "Google Gemini" },
  { id: "anthropic", label: "Anthropic Claude" },
];

const DIFFICULTIES: Difficulty[] = ["facile", "moyen", "difficile"];

export function AiGenerate() {
  const nav = useNavigate();
  const provider = useAiSettings((s) => s.provider);
  const keys = useAiSettings((s) => s.keys);
  const models = useAiSettings((s) => s.models);
  const setProvider = useAiSettings((s) => s.setProvider);
  const setKey = useAiSettings((s) => s.setKey);
  const setModel = useAiSettings((s) => s.setModel);

  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("moyen");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiKey = keys[provider] ?? "";

  async function generate() {
    setError(null);
    if (!topic.trim()) {
      setError("Indique un sujet pour le quiz.");
      return;
    }
    if (!apiKey.trim()) {
      setError("Renseigne ta clé API plus bas.");
      return;
    }
    setBusy(true);
    try {
      const draft = await generateQuiz(
        { topic, count, difficulty },
        { provider, apiKey, models },
      );
      saveDraft(draft);
      nav("/create/new");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

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
        Décris un sujet, l'IA propose un quiz que tu pourras relire et modifier
        avant de l'enregistrer.
      </p>

      {/* --- paramètres de génération --- */}
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

        <div className="flex gap-3">
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
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl bg-rose-500/20 px-4 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      <Button full className="mt-5" onClick={generate} disabled={busy}>
        <Sparkles className="size-5" /> Générer le quiz
      </Button>

      {busy ? <Spinner label="Génération en cours…" /> : null}

      {/* --- réglages BYOK --- */}
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
