import { RotateCw, Volume2, VolumeX } from 'lucide-react';
import { useAiSettings } from '../store/settingsStore';
import { useT, useLang, LANGS } from '../i18n';

/**
 * Pied de page de l'ACCUEIL : les commandes propres à l'app — langue, son,
 * rechargement.
 *
 * LES LIENS FAMILLE N'Y SONT PAS : ils ont leur composant, `FamilyLinks`, que
 * l'accueil rend juste après celui-ci et que le Compte rend aussi — les deux
 * écrans, et seulement eux, que la règle famille du 06/09/2026 leur réserve.
 * Rendus un temps par la coquille, ils suivaient une partie en cours.
 */
export function AppFooter() {
  const t = useT();
  const soundOn = useAiSettings(s => s.soundOn);
  const setSoundOn = useAiSettings(s => s.setSoundOn);
  const lang = useLang(s => s.lang);
  const setLang = useLang(s => s.setLang);
  return (
    <div className="mt-auto flex flex-col items-center gap-3 pt-8 text-sm text-white/50">
      <div
        className="flex items-center gap-1"
        aria-label={t('footer.langAria')}
      >
        {LANGS.map(l => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            aria-pressed={lang === l.code}
            // Le nom commence par ce qui est écrit (« FR ») : WCAG 2.5.3,
            // axe 4.14, le 29/10/2026.
            aria-label={`${l.code.toUpperCase()}, ${l.label}`}
            className={`rounded-lg px-2 py-1 transition ${
              lang === l.code ? 'bg-white/10 text-white' : 'hover:text-white'
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
          // Pas d'aria-label : le bouton montre son état (« Son activé ») et
          // aria-pressed le dit ; un nom d'action à part (« Couper le son »)
          // laissait ce texte hors du nom accessible (WCAG 2.5.3, axe 4.14).
          className="inline-flex items-center gap-1.5 hover:text-white"
        >
          {soundOn ? (
            <Volume2 className="size-4" />
          ) : (
            <VolumeX className="size-4" />
          )}
          {soundOn ? t('footer.soundOn') : t('footer.soundOff')}
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 hover:text-white"
        >
          <RotateCw className="size-4" /> {t('footer.reload')}
        </button>
      </div>
      {/* Les liens famille ne sont plus ici : ils sont rendus par la coquille
          (`App.tsx`), hors des routes, donc sur TOUS les écrans et plus
          seulement sur l'accueil. Ce pied de page garde ce qui lui est propre
          — langue, son, rechargement. */}
    </div>
  );
}
