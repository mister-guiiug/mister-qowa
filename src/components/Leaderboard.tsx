import { m } from "framer-motion";
import type { LeaderboardEntry } from "@shared/contracts";

export function Leaderboard({
  entries,
  highlightUid = null,
  max = 10,
}: {
  entries: LeaderboardEntry[];
  highlightUid?: string | null;
  max?: number;
}) {
  if (entries.length === 0)
    return (
      <p className="text-center text-white/60">Personne pour l’instant…</p>
    );
  return (
    <ol className="flex flex-col gap-2">
      {entries.slice(0, max).map((e, i) => (
        <m.li
          key={e.uid}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
            e.uid === highlightUid ? "bg-brand text-white" : "bg-white/5"
          }`}
        >
          <span className="flex items-center gap-3">
            <span className="w-6 text-right font-display text-white/70">
              {i + 1}
            </span>
            {e.avatar ? <span aria-hidden>{e.avatar}</span> : null}
            <span className="font-semibold">{e.pseudo}</span>
          </span>
          <span className="font-display tabular-nums">{e.total}</span>
        </m.li>
      ))}
    </ol>
  );
}
