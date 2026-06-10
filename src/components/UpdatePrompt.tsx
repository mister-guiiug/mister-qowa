import { useRegisterSW } from "virtual:pwa-register/react";
import { RotateCw } from "lucide-react";
import { useT } from "../i18n";

/**
 * Bannière de mise à jour PWA. Le SW est en `prompt` (pas d'auto-reload pendant
 * une partie) : quand une nouvelle version est prête, on propose de recharger.
 * Voir aussi le bouton « Recharger » manuel du footer.
 */
export function UpdatePrompt() {
  const t = useT();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // Vérifie une nouvelle version toutes les heures.
      if (registration) {
        setInterval(() => void registration.update(), 60 * 60 * 1000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="alert"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-brand px-4 py-3 text-white shadow-xl ring-1 ring-white/20"
    >
      <span className="text-sm font-medium">{t("update.available")}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="text-sm text-white/70 hover:text-white"
        >
          {t("update.later")}
        </button>
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-1.5 text-sm font-semibold hover:bg-white/30"
        >
          <RotateCw className="size-4" /> {t("common.reload")}
        </button>
      </div>
    </div>
  );
}
