import { motion, AnimatePresence } from "framer-motion";

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
          <motion.span
            key={it.id}
            initial={{ y: 0, opacity: 1, x: ((it.id % 5) - 2) * 36 }}
            animate={{ y: -200, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3 }}
            className="absolute text-3xl"
          >
            {it.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

const EMOJIS = ["👍", "❤️", "😂", "😮", "🎉", "🔥"];

export function ReactionBar({ onSend }: { onSend: (emoji: string) => void }) {
  return (
    <div className="flex justify-center gap-2">
      {EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          aria-label={`Envoyer la réaction ${e}`}
          onClick={() => onSend(e)}
          className="rounded-full bg-white/10 px-3 py-2 text-xl transition hover:bg-white/20 active:scale-90"
        >
          {e}
        </button>
      ))}
    </div>
  );
}
