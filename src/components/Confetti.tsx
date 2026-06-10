import { m, useReducedMotion } from "framer-motion";

const COLORS = ["#e21b3c", "#1368ce", "#d89e00", "#26890c", "#7c3aed"];

/** Pluie de confettis (overlay) — joue une fois au montage. */
export function Confetti({ count = 28 }: { count?: number }) {
  // `top` n'est pas un transform : MotionConfig ne le neutralise pas, on coupe ici.
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.4;
        const duration = 1.8 + Math.random() * 1.4;
        return (
          <m.span
            key={i}
            initial={{ top: "-5%", opacity: 1, rotate: 0 }}
            animate={{ top: "105%", rotate: 540, opacity: 0 }}
            transition={{ duration, delay, ease: "easeIn" }}
            style={{
              position: "absolute",
              left: `${left}%`,
              width: 8,
              height: 14,
              borderRadius: 2,
              background: COLORS[i % COLORS.length],
            }}
          />
        );
      })}
    </div>
  );
}
