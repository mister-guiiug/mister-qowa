import type { QuizOption } from "@shared/contracts";

/** Barres de répartition des réponses (vue host), bonne réponse en vert. */
export function AnswerDistribution({
  options,
  byChoice,
  total,
  correctId,
}: {
  options: QuizOption[];
  byChoice: Record<string, number>;
  total: number;
  correctId?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => {
        const n = byChoice[o.id] ?? 0;
        const pct = total ? Math.round((100 * n) / total) : 0;
        const ok = o.id === correctId;
        return (
          <div key={o.id} className="flex items-center gap-2">
            <span
              className={`w-28 truncate text-sm ${ok ? "font-semibold text-answer-green" : "text-white/70"}`}
            >
              {o.label}
            </span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full transition-all ${ok ? "bg-answer-green" : "bg-brand"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 text-right text-sm tabular-nums text-white/60">
              {n}
            </span>
          </div>
        );
      })}
    </div>
  );
}
