import { useEffect, useState } from "react";

/**
 * Barre de temps qui se vide (vert → rouge sous 25 %). Auto-tickée, SANS
 * dépendance Firebase (utilisable en Solo hors-ligne) : l'appelant fournit
 * `endsAt` (ms epoch) et `timeLimitMs`, + un `offset` horloge optionnel
 * (décalage serveur RTDB en multijoueur, 0 en solo).
 * `aria-hidden` : le compte à rebours chiffré annonce déjà le temps restant.
 */
export function TimerBar({
  endsAt,
  timeLimitMs,
  offset = 0,
}: {
  endsAt: number;
  timeLimitMs: number;
  offset?: number;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, endsAt - (now + offset));
  const pct =
    timeLimitMs > 0 ? Math.min(100, (100 * remaining) / timeLimitMs) : 0;

  return (
    <div
      aria-hidden
      className="h-2 w-full overflow-hidden rounded-full bg-white/10"
    >
      <div
        className={`h-full ${pct < 25 ? "bg-answer-red" : "bg-brand"}`}
        style={{ width: `${pct}%`, transition: "width 100ms linear" }}
      />
    </div>
  );
}
