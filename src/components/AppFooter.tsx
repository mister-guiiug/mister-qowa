import { Coffee, RotateCw, Volume2, VolumeX } from "lucide-react";
import { REPO_URL, SPONSOR_URL } from "../links";
import { useAiSettings } from "../store/settingsStore";
import { useT, useLang, LANGS } from "../i18n";

// lucide 1.x a retiré les icônes de marque : SVG GitHub en ligne (règle parc).
function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.57.1.78-.25.78-.55v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.2-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.75.81 1.2 1.84 1.2 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.05.78 2.12v3.14c0 .31.2.66.79.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

export function AppFooter() {
  const t = useT();
  const soundOn = useAiSettings((s) => s.soundOn);
  const setSoundOn = useAiSettings((s) => s.setSoundOn);
  const lang = useLang((s) => s.lang);
  const setLang = useLang((s) => s.setLang);
  return (
    <footer className="mt-auto flex flex-col items-center gap-3 pt-8 text-sm text-white/50">
      <div
        className="flex items-center gap-1"
        aria-label={t("footer.langAria")}
      >
        {LANGS.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            aria-pressed={lang === l.code}
            aria-label={l.label}
            className={`rounded-lg px-2 py-1 transition ${
              lang === l.code ? "bg-white/10 text-white" : "hover:text-white"
            }`}
          >
            {l.flag} {l.code.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => setSoundOn(!soundOn)}
          aria-pressed={soundOn}
          aria-label={soundOn ? t("footer.muteAria") : t("footer.unmuteAria")}
          className="inline-flex items-center gap-1.5 hover:text-white"
        >
          {soundOn ? (
            <Volume2 className="size-4" />
          ) : (
            <VolumeX className="size-4" />
          )}
          {soundOn ? t("footer.soundOn") : t("footer.soundOff")}
        </button>
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 hover:text-white"
        >
          <GithubMark className="size-4" /> {t("footer.source")}
        </a>
        <a
          href={SPONSOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 hover:text-white"
        >
          <Coffee className="size-4" /> {t("footer.support")}
        </a>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 hover:text-white"
        >
          <RotateCw className="size-4" /> {t("footer.reload")}
        </button>
      </div>
    </footer>
  );
}
