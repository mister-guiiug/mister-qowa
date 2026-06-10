import { useState } from "react";
import { Trash2, Plus, X, ArrowUp, ArrowDown, ImagePlus } from "lucide-react";
import { QUESTION_TYPES, type QuestionType } from "@shared/gameState";
import type { DraftQuestion } from "../lib/quizDraft";
import { blankOption, retypeQuestion } from "../lib/quizDraft";
import { uploadQuestionImage } from "../lib/media";
import { errMsg } from "../lib/err";

const TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Choix multiple",
  true_false: "Vrai / Faux",
  free_text: "Réponse libre",
  poll: "Sondage (sans bonne réponse)",
};
const TIME_OPTIONS = [10000, 15000, 20000, 30000, 60000];
const POINTS_OPTIONS = [500, 1000, 2000];

const field =
  "rounded-xl bg-white/10 px-3 py-2 outline-none ring-1 ring-white/15 focus:ring-brand";

export function QuestionEditor({
  q,
  index,
  count,
  onChange,
  onRemove,
  onMove,
}: {
  q: DraftQuestion;
  index: number;
  count: number;
  onChange: (q: DraftQuestion) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const set = (patch: Partial<DraftQuestion>) => onChange({ ...q, ...patch });
  const hasOptions = q.type === "multiple_choice" || q.type === "poll";
  const [uploading, setUploading] = useState(false);
  const [mediaErr, setMediaErr] = useState<string | null>(null);

  async function onPickImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setMediaErr(null);
    try {
      set({ mediaUrl: await uploadQuestionImage(file) });
    } catch (e) {
      setMediaErr(errMsg(e));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-display text-lg">Question {index + 1}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label="Monter"
            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 disabled:opacity-30"
          >
            <ArrowUp className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === count - 1}
            aria-label="Descendre"
            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 disabled:opacity-30"
          >
            <ArrowDown className="size-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Supprimer la question"
            className="rounded-lg p-1.5 text-rose-300 hover:bg-rose-500/15"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <select
          value={q.type}
          aria-label="Type de question"
          onChange={(e) =>
            onChange(retypeQuestion(q, e.target.value as QuestionType))
          }
          className={field}
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t} value={t} className="bg-[#1a1230]">
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>

        <input
          value={q.prompt}
          maxLength={300}
          aria-label={`Énoncé de la question ${index + 1}`}
          onChange={(e) => set({ prompt: e.target.value })}
          placeholder="Énoncé de la question"
          className={field}
        />

        {/* Image optionnelle */}
        {q.mediaUrl ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <img
                src={q.mediaUrl}
                alt={q.mediaAlt ?? ""}
                className="max-h-24 rounded-lg object-contain"
              />
              <button
                type="button"
                onClick={() =>
                  set({ mediaUrl: undefined, mediaAlt: undefined })
                }
                className="text-sm text-rose-300 hover:text-rose-200"
              >
                Retirer l’image
              </button>
            </div>
            <input
              value={q.mediaAlt ?? ""}
              maxLength={200}
              onChange={(e) => set({ mediaAlt: e.target.value })}
              placeholder="Description de l’image (lecteurs d’écran)"
              aria-label={`Description de l’image de la question ${index + 1}`}
              className={field}
            />
            <p className="text-xs text-white/40">
              Décris l’image sans révéler la réponse (visible des joueurs
              malvoyants).
            </p>
          </div>
        ) : (
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void onPickImage(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <ImagePlus className="size-4" />{" "}
            {uploading ? "Envoi…" : "Ajouter une image"}
          </label>
        )}
        {mediaErr ? <p className="text-sm text-rose-300">{mediaErr}</p> : null}

        {/* Choix multiple / Sondage : options */}
        {hasOptions ? (
          <div className="flex flex-col gap-2">
            {q.options.map((o, i) => (
              <div key={o.id} className="flex items-center gap-2">
                {q.type === "multiple_choice" ? (
                  <input
                    type="radio"
                    name={`correct-${q.id}`}
                    checked={q.correctOptionId === o.id}
                    onChange={() => set({ correctOptionId: o.id })}
                    aria-label="Bonne réponse"
                    className="size-5 accent-answer-green"
                  />
                ) : null}
                <input
                  value={o.label}
                  maxLength={120}
                  onChange={(e) =>
                    set({
                      options: q.options.map((x, idx) =>
                        idx === i ? { ...x, label: e.target.value } : x,
                      ),
                    })
                  }
                  placeholder={`Réponse ${i + 1}`}
                  aria-label={`Réponse ${i + 1}`}
                  className={`${field} flex-1`}
                />
                {q.options.length > 2 ? (
                  <button
                    type="button"
                    onClick={() =>
                      set({
                        options: q.options.filter((_, idx) => idx !== i),
                        correctOptionId:
                          q.correctOptionId === o.id ? "" : q.correctOptionId,
                      })
                    }
                    aria-label="Retirer l’option"
                    className="rounded-lg p-1.5 text-white/50 hover:bg-white/10"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
            ))}
            {q.options.length < 4 ? (
              <button
                type="button"
                onClick={() => set({ options: [...q.options, blankOption()] })}
                className="inline-flex items-center gap-1 self-start text-sm text-brand-soft hover:text-white"
              >
                <Plus className="size-4" /> Ajouter une option
              </button>
            ) : null}
            {q.type === "multiple_choice" ? (
              <p className="text-xs text-white/40">
                Coche le rond vert à gauche de la bonne réponse.
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Vrai / Faux */}
        {q.type === "true_false" ? (
          <div className="flex gap-2">
            {[
              { v: true, label: "Vrai" },
              { v: false, label: "Faux" },
            ].map(({ v, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => set({ correct: v })}
                className={`flex-1 rounded-xl px-4 py-2 font-semibold ${
                  q.correct === v ? "bg-answer-green text-white" : "bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        {/* Réponse libre */}
        {q.type === "free_text" ? (
          <div className="flex flex-col gap-2">
            {q.acceptedAnswers.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={a}
                  maxLength={120}
                  onChange={(e) =>
                    set({
                      acceptedAnswers: q.acceptedAnswers.map((x, idx) =>
                        idx === i ? e.target.value : x,
                      ),
                    })
                  }
                  placeholder={`Réponse acceptée ${i + 1}`}
                  aria-label={`Réponse acceptée ${i + 1}`}
                  className={`${field} flex-1`}
                />
                {q.acceptedAnswers.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      set({
                        acceptedAnswers: q.acceptedAnswers.filter(
                          (_, idx) => idx !== i,
                        ),
                      })
                    }
                    aria-label="Retirer"
                    className="rounded-lg p-1.5 text-white/50 hover:bg-white/10"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                set({ acceptedAnswers: [...q.acceptedAnswers, ""] })
              }
              className="inline-flex items-center gap-1 self-start text-sm text-brand-soft hover:text-white"
            >
              <Plus className="size-4" /> Autre réponse acceptée
            </button>
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={q.caseSensitive}
                onChange={(e) => set({ caseSensitive: e.target.checked })}
                className="size-4 accent-brand"
              />
              Sensible à la casse
            </label>
          </div>
        ) : null}

        {/* Explication montrée aux joueurs après la clôture (optionnelle) */}
        {q.type !== "poll" ? (
          <input
            value={q.explanation ?? ""}
            maxLength={300}
            onChange={(e) => set({ explanation: e.target.value })}
            placeholder="Explication de la réponse (optionnelle)"
            aria-label={`Explication de la question ${index + 1}`}
            className={field}
          />
        ) : null}

        {/* Réglages : temps + points */}
        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1 text-xs text-white/50">
            Temps
            <select
              value={q.timeLimitMs}
              onChange={(e) => set({ timeLimitMs: Number(e.target.value) })}
              className={field}
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t} className="bg-[#1a1230]">
                  {t / 1000}s
                </option>
              ))}
            </select>
          </label>
          {q.type !== "poll" ? (
            <label className="flex flex-1 flex-col gap-1 text-xs text-white/50">
              Points
              <select
                value={q.basePoints}
                onChange={(e) => set({ basePoints: Number(e.target.value) })}
                className={field}
              >
                {POINTS_OPTIONS.map((p) => (
                  <option key={p} value={p} className="bg-[#1a1230]">
                    {p}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </div>
    </div>
  );
}
