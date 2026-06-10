import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useT } from "../i18n";

/** Événement non standard `beforeinstallprompt` (Chromium). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "mister-qowa:install-dismissed";

/**
 * Bannière d'installation PWA : capte `beforeinstallprompt`, propose
 * l'installation, et ne re-propose plus une fois rejetée (localStorage).
 * N'apparaît que si le navigateur émet l'événement (app pas déjà installée).
 */
export function InstallPrompt() {
  const t = useT();
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      /* localStorage indisponible : on tente quand même */
    }
    const onBip = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (!evt) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setEvt(null);
  };
  const install = () => {
    void evt.prompt().finally(dismiss);
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
