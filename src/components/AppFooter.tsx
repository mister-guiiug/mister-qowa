import { RotateCw, Volume2, VolumeX } from "lucide-react";
import { AppFooter as FamilyFooter } from "@mister-guiiug/dev-wpa-config/react/app-footer";
import {
  SPONSOR_URL,
  repoUrl,
} from "@mister-guiiug/dev-wpa-config/apps-catalog";
import { useAiSettings } from "../store/settingsStore";
import { useT, useLang, LANGS } from "../i18n";

/**
 * Pied de page : commandes propres à l'app (langue, son, rechargement) +
 * liens famille source/sponsor via le socle (`react/app-footer`), qui fournit
 * aussi les icônes GitHub/café — le SVG GitHub en ligne local est retiré.
 * Les libellés restent traduits par l'i18n de l'app (5 langues, le socle
 * n'en connaît que 2) : ils sont passés en props.
 *
 * Les URL viennent du catalogue famille (`apps-catalog`, module pur) et non
 * plus d'une copie locale : `repoUrl('mister-qowa')` dérive l'adresse du
 * dépôt de l'identifiant catalogue, qui EST le nom du dépôt GitHub.
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
      <FamilyFooter
        className="justify-center"
        repoUrl={repoUrl("mister-qowa")}
        sponsorUrl={SPONSOR_URL}
        sourceLabel={t("footer.source")}
        sponsorLabel={t("footer.support")}
      />
    </div>
  );
}
