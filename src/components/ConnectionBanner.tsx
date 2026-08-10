import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useConnectionState } from "../hooks/useServerTime";
import { useT } from "../i18n";

/**
 * Bandeau discret « Hors ligne — reconnexion… » piloté par `.info/connected`.
 * Débounce ~1,5 s pour ne pas clignoter sur les micro-coupures, et ne s'affiche
 * jamais au tout premier rendu (online par défaut).
 */
export function ConnectionBanner() {
  const t = useT();
  const online = useConnectionState();
  const [debounced, setDebounced] = useState(false);
  const [lastOnline, setLastOnline] = useState(online);

  // Remise à zéro pendant le rendu (et non dans un effet) : c'est le motif
  // recommandé pour réinitialiser un état quand une entrée change, et ça évite
  // le rendu en cascade d'un setState synchrone dans un effet.
  if (online !== lastOnline) {
    setLastOnline(online);
    setDebounced(false);
  }

  useEffect(() => {
    if (online) return;
    const id = setTimeout(() => setDebounced(true), 1500);
    return () => clearTimeout(id);
  }, [online]);

  if (online || !debounced) return null;
  return (
    <div
      role="status"
      className="mb-3 flex items-center justify-center gap-2 rounded-xl bg-amber-500/20 px-4 py-2 text-sm text-amber-100"
    >
      <WifiOff className="size-4" />
      {t("connection.offline")}
    </div>
  );
}
