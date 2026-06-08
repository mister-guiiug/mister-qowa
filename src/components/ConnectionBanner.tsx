import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useConnectionState } from "../hooks/useServerTime";

/**
 * Bandeau discret « Hors ligne — reconnexion… » piloté par `.info/connected`.
 * Débounce ~1,5 s pour ne pas clignoter sur les micro-coupures, et ne s'affiche
 * jamais au tout premier rendu (online par défaut).
 */
export function ConnectionBanner() {
  const online = useConnectionState();
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    if (online) {
      setShowOffline(false);
      return;
    }
    const id = setTimeout(() => setShowOffline(true), 1500);
    return () => clearTimeout(id);
  }, [online]);

  if (!showOffline) return null;
  return (
    <div
      role="status"
      className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-amber-500/20 px-4 py-2 text-sm text-amber-100"
    >
      <WifiOff className="size-4" />
      Hors ligne — reconnexion…
    </div>
  );
}
