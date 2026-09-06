import { RotateCw, Volume2, VolumeX } from "lucide-react";
import { useAiSettings } from "../store/settingsStore";
import { useT, useLang, LANGS } from "../i18n";

/**
 * Pied de page de l'ACCUEIL : les commandes propres à l'app — langue, son,
 * rechargement.
 *
 * LES LIENS FAMILLE N'Y SONT PLUS. Ils y étaient, et cet écran est le seul à
 * rendre ce composant : le code source et le soutien n'existaient donc que sur
 * l'accueil. La règle famille du 05/09/2026 les veut aussi ailleurs, et la
 * réponse du socle est de les rendre dans la COQUILLE, hors des routes. C'est
 * ce que fait `App.tsx`.
 */
export function AppFooter() {
  const t = useT();
  const soundOn = useAiSettings((s) => s.soundOn);
  const setSoundOn = useAiSettings((s) => s.setSoundOn);
  const lang = useLang((s) => s.lang);
  const setLang = useLang((s) => s.setLang);
  return (
    <div className="mt-auto flex flex-col items-center gap-3 pt-8 text-sm text-white/50">
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
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 hover:text-white"
        >
          <RotateCw className="size-4" /> {t("footer.reload")}
        </button>
      </div>
      {/* Les liens famille ne sont plus ici : ils sont rendus par la coquille
          (`App.tsx`), hors des routes, donc sur TOUS les écrans et plus
          seulement sur l'accueil. Ce pied de page garde ce qui lui est propre
          — langue, son, rechargement. */}
    </div>
  );
}
