import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import type { LeaderboardEntry } from "@shared/contracts";
import { Confetti } from "./Confetti";

const MEDALS = ["🥇", "🥈", "🥉"];
const HEIGHTS = ["h-40", "h-28", "h-20"];
const ORDER = [1, 0, 2]; // 2e · 1er · 3e

export function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const top = entries.slice(0, 3);
  return (
    <div className="flex flex-col items-center gap-6">
      <Confetti />
      <Trophy className="size-12 text-answer-yellow" />
      <div className="flex w-full items-end justify-center gap-2">
        {ORDER.map((rank) => {
          const e = top[rank];
          if (!e) return <div key={rank} className="flex-1" />;
          return (
            <motion.div
              key={e.uid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (3 - rank), type: "spring" }}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <span className="text-2xl">{MEDALS[rank]}</span>
              {e.avatar ? (
                <span className="text-xl" aria-hidden>
                  {e.avatar}
                </span>
              ) : null}
              <span className="max-w-full truncate text-sm font-semibold">
                {e.pseudo}
              </span>
              <span className="font-display tabular-nums text-white/70">
                {e.total}
              </span>
              <div
                className={`w-full rounded-t-2xl bg-brand/80 ${HEIGHTS[rank]}`}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
