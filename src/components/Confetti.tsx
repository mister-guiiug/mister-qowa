import { m, useReducedMotion } from "framer-motion";

const COLORS = ["#e21b3c", "#1368ce", "#d89e00", "#26890c", "#7c3aed"];

/**
 * Dispersion pseudo-aléatoire déterministe (hash à base de sinus, valeur 0..1).
 *
 * `Math.random()` est interdit pendant le rendu — le compilateur React exige un
 * rendu pur pour pouvoir le rejouer. Ici la position ne dépend que de l'index et
 * d'un sel : le rendu reste pur, et les confettis ne sautent plus à une nouvelle
 * position au moindre re-rendu du parent. Le motif est donc identique d'une
 * animation à l'autre, ce qui est imperceptible pour un effet de célébration.
 */
function scatter(index: number, salt: number): number {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Pluie de confettis (overlay) — joue une fois au montage. */
export function Confetti({ count = 28 }: { count?: number }) {
  // `top` n'est pas un transform : MotionConfig ne le neutralise pas, on coupe ici.
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const left = scatter(i, 1) * 100;
        const delay = scatter(i, 2) * 0.4;
        const duration = 1.8 + scatter(i, 3) * 1.4;
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
