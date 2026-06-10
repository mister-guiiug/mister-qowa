import { useEffect, useState } from "react";
import { useServerOffset } from "../hooks/useServerTime";
import { feedback } from "../lib/feedback";
import { useT } from "../i18n";

/** Compte à rebours basé sur l'instant serveur `endsAt` (ms epoch), horloge alignée. */
export function Countdown({ endsAt }: { endsAt: number }) {
  const t = useT();
  const offset = useServerOffset();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, Math.ceil((endsAt - (now + offset)) / 1000));

  // Tic des 3 dernières secondes (une fois par seconde entière).
  useEffect(() => {
    if (remaining > 0 && remaining <= 3) feedback.tick();
  }, [remaining]);
  return (
    <div
      className="font-display text-4xl tabular-nums"
      aria-live="polite"
      aria-label={t("countdown.aria", { n: remaining })}
    >
      {remaining}
    </div>
  );
}
