import { useState } from "react";
import { useInstallPrompt } from "@mister-guiiug/dev-wpa-config/react/use-install-prompt";
import { Download, X } from "lucide-react";
import { useT } from "../i18n";

const DISMISS_KEY = "mister-qowa:install-dismissed";

function isDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) !== null;
  } catch {
    /* localStorage indisponible : on tente quand même */
    return false;
  }
}

/**
 * Bannière d'installation PWA : le hook du socle capte `beforeinstallprompt`
 * (et détecte l'app déjà installée) ; la persistance du rejet reste locale —
 * une fois rejetée, la bannière ne se re-propose plus (localStorage).
 */
export function InstallPrompt() {
  const t = useT();
  const { canInstall, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(isDismissed);

  if (!canInstall || dismissed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };
  const install = () => {
    void promptInstall().finally(dismiss);
  };

  return (
    <div
      role="dialog"
      aria-label={t("install.prompt")}
      className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white shadow-xl ring-1 ring-white/20 backdrop-blur"
    >
      <span>{t("install.prompt")}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("update.later")}
          className="rounded-lg p-1.5 text-white/60 hover:text-white"
        >
          <X className="size-4" />
        </button>
        <button
          type="button"
          onClick={install}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 font-semibold hover:brightness-110"
        >
          <Download className="size-4" /> {t("install.action")}
        </button>
      </div>
    </div>
  );
}
