import { useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { useT } from "../i18n";

/** Emojis qui flottent vers le haut (overlay). */
export function FloatingReactions({
  items,
}: {
  items: { id: number; emoji: string }[];
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center">
      <AnimatePresence>
        {items.map((it) => (
          <m.span
            key={it.id}
            initial={{ y: 0, opacity: 1, x: ((it.id % 5) - 2) * 36 }}
            animate={{ y: -200, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3 }}
            className="absolute text-3xl"
          >
            {it.emoji}
          </m.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

const EMOJIS = ["👍", "❤️", "😂", "😮", "🎉", "🔥"];
const COOLDOWN_MS = 1200;

export function ReactionBar({ onSend }: { onSend: (emoji: string) => void }) {
  const t = useT();
  // Anti-flood : 1 réaction max par période de refroidissement.
  const [coolingDown, setCoolingDown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const send = (e: string) => {
    if (coolingDown) return;
    setCoolingDown(true);
    onSend(e);
    timer.current = setTimeout(() => setCoolingDown(false), COOLDOWN_MS);
  };

  return (
    <div className="flex justify-center gap-2">
      {EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          aria-label={t("reactions.sendAria", { emoji: e })}
          disabled={coolingDown}
          onClick={() => send(e)}
          className="rounded-full bg-white/10 px-3 py-2 text-xl transition hover:bg-white/20 active:scale-90 disabled:opacity-40"
        >
          {e}
        </button>
      ))}
    </div>
  );
}
