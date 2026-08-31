import { useState } from "react";
import { Trash2, Plus, X, ArrowUp, ArrowDown, ImagePlus } from "lucide-react";
import { QUESTION_TYPES, type QuestionType } from "@shared/gameState";
import type { DraftQuestion } from "../lib/quizDraft";
import { blankOption, retypeQuestion } from "../lib/quizDraft";
import { uploadQuestionImage } from "../lib/media";
import { useNetworkGuard } from "../hooks/useNetworkGuard";
import { useErr, useT, type Key } from "../i18n";

const TYPE_KEYS: Record<QuestionType, Key> = {
  multiple_choice: "qe.typeMultipleChoice",
  true_false: "qe.typeTrueFalse",
  free_text: "qe.typeFreeText",
  poll: "qe.typePoll",
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
  const tr = useT();
  const err = useErr();
  const set = (patch: Partial<DraftQuestion>) => onChange({ ...q, ...patch });
  const hasOptions = q.type === "multiple_choice" || q.type === "poll";
  const [uploading, setUploading] = useState(false);
  const [mediaErr, setMediaErr] = useState<string | null>(null);
  // Seul l'envoi d'image sort de l'appareil (Firebase Storage). Tout le reste de
  // l'éditeur est un brouillon local — il doit continuer sans un mot.
  const guard = useNetworkGuard();

  async function onPickImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setMediaErr(null);
    try {
      set({ mediaUrl: await uploadQuestionImage(file) });
    } catch (e) {
      setMediaErr(err(e));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white/5 p-4 ring-1 ring-white/10">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-display text-lg">
          {tr("qe.questionN", { n: index + 1 })}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label={tr("qe.moveUp")}
            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 disabled:opacity-30"
          >
            <ArrowUp className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === count - 1}
            aria-label={tr("qe.moveDown")}
            className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 disabled:opacity-30"
          >
            <ArrowDown className="size-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={tr("qe.removeQuestion")}
            className="rounded-lg p-1.5 text-rose-300 hover:bg-rose-500/15"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <select
          value={q.type}
          aria-label={tr("qe.typeAria")}
          onChange={(e) =>
            onChange(retypeQuestion(q, e.target.value as QuestionType))
          }
          className={field}
        >
          {QUESTION_TYPES.map((qt) => (
            <option key={qt} value={qt} className="bg-[#1a1230]">
              {tr(TYPE_KEYS[qt])}
            </option>
          ))}
        </select>

        <input
          value={q.prompt}
          maxLength={300}
          aria-label={tr("qe.promptAria", { n: index + 1 })}
          onChange={(e) => set({ prompt: e.target.value })}
          placeholder={tr("qe.promptPlaceholder")}
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
                {tr("qe.removeImage")}
              </button>
            </div>
            <input
              value={q.mediaAlt ?? ""}
              maxLength={200}
              onChange={(e) => set({ mediaAlt: e.target.value })}
              placeholder={tr("qe.mediaAltPlaceholder")}
              aria-label={tr("qe.mediaAltAria", { n: index + 1 })}
              className={field}
            />
            <p className="text-xs text-white/40">{tr("qe.mediaAltHint")}</p>
          </div>
        ) : (
          <label
            {...guard.disabledProps}
            className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm hover:bg-white/15 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={!guard.allowed}
              onChange={(e) => {
                void onPickImage(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <ImagePlus className="size-4" />{" "}
            {uploading ? tr("qe.uploading") : tr("qe.addImage")}
          </label>
        )}
        {guard.reason ? (
          <p role="status" className="text-sm text-amber-200">
            {guard.reason}
          </p>
        ) : null}
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
                    aria-label={tr("qe.correctAnswerAria")}
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
                  placeholder={tr("qe.answerN", { n: i + 1 })}
                  aria-label={tr("qe.answerN", { n: i + 1 })}
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
                    aria-label={tr("qe.removeOption")}
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
                <Plus className="size-4" /> {tr("qe.addOption")}
              </button>
            ) : null}
            {q.type === "multiple_choice" ? (
              <p className="text-xs text-white/40">{tr("qe.correctHint")}</p>
            ) : null}
          </div>
        ) : null}

        {/* Vrai / Faux */}
        {q.type === "true_false" ? (
          <div className="flex gap-2">
            {[
              { v: true, key: "qe.true" as const },
              { v: false, key: "qe.false" as const },
            ].map(({ v, key }) => (
              <button
                key={key}
                type="button"
                onClick={() => set({ correct: v })}
                className={`flex-1 rounded-xl px-4 py-2 font-semibold ${
                  q.correct === v ? "bg-answer-green text-white" : "bg-white/10"
                }`}
              >
                {tr(key)}
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
                  placeholder={tr("qe.acceptedAnswerN", { n: i + 1 })}
                  aria-label={tr("qe.acceptedAnswerN", { n: i + 1 })}
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
                    aria-label={tr("qe.remove")}
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
              <Plus className="size-4" /> {tr("qe.addAcceptedAnswer")}
            </button>
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={q.caseSensitive}
                onChange={(e) => set({ caseSensitive: e.target.checked })}
                className="size-4 accent-brand"
              />
              {tr("qe.caseSensitive")}
            </label>
          </div>
        ) : null}

        {/* Explication montrée aux joueurs après la clôture (optionnelle) */}
        {q.type !== "poll" ? (
          <input
            value={q.explanation ?? ""}
            maxLength={300}
            onChange={(e) => set({ explanation: e.target.value })}
            placeholder={tr("qe.explanationPlaceholder")}
            aria-label={tr("qe.explanationAria", { n: index + 1 })}
            className={field}
          />
        ) : null}

        {/* Réglages : temps + points */}
        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1 text-xs text-white/50">
            {tr("qe.time")}
            <select
              value={q.timeLimitMs}
              onChange={(e) => set({ timeLimitMs: Number(e.target.value) })}
              className={field}
            >
              {TIME_OPTIONS.map((ms) => (
                <option key={ms} value={ms} className="bg-[#1a1230]">
                  {tr("qe.seconds", { n: ms / 1000 })}
                </option>
              ))}
            </select>
          </label>
          {q.type !== "poll" ? (
            <label className="flex flex-1 flex-col gap-1 text-xs text-white/50">
              {tr("qe.points")}
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
