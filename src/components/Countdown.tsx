import { useEffect, useState } from "react";
import { useServerOffset } from "../hooks/useServerTime";

/** Compte à rebours basé sur l'instant serveur `endsAt` (ms epoch), horloge alignée. */
export function Countdown({ endsAt }: { endsAt: number }) {
  const offset = useServerOffset();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, Math.ceil((endsAt - (now + offset)) / 1000));
  return (
    <div
      className="font-display text-4xl tabular-nums"
      aria-live="polite"
      aria-label={`${remaining} secondes restantes`}
    >
      {remaining}
    </div>
  );
}
