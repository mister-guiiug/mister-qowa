import { motion } from "framer-motion";
import type { TeamStanding } from "@shared/teams";

export function TeamLeaderboard({ standings }: { standings: TeamStanding[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {standings.map((t, i) => (
        <motion.li
          key={t.teamId}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-2xl px-4 py-3"
          style={{ background: `${t.color}33` }}
        >
          <span className="flex items-center gap-3">
            <span className="w-5 text-right font-display text-white/70">
              {i + 1}
            </span>
            <span
              className="size-3 rounded-full"
              style={{ background: t.color }}
            />
            <span className="font-semibold">{t.name}</span>
          </span>
          <span className="font-display tabular-nums">{t.total}</span>
        </motion.li>
      ))}
    </ol>
  );
}
