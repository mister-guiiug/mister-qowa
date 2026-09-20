import { useState, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Users,
  Gamepad2,
  History,
  LoaderCircle,
  Play,
  UserCog,
} from 'lucide-react';
import { Screen, Button } from '../lib/ui';
import { AppFooter } from '../components/AppFooter';
import { PwaInstallPrompt } from '@mister-guiiug/dev-pwa-config/react/pwa-install-prompt';
import { useGameStore } from '../store/gameStore';
import { useProfile } from '../store/profileStore';
import { BADGE_EMOJI } from '../lib/profile';
import { useT } from '../i18n';

export function Home() {
  const t = useT();
  const nav = useNavigate();
  const [enCours, demarreLaTransition] = useTransition();
  const [ciblePendante, setCiblePendante] = useState<string | null>(null);

  /**
   * LA TRANSITION EST LA NÔTRE, et c'est tout l'intérêt.
   *
   * Chaque entrée de cet écran mène à une route `React.lazy`. Sans transition à
   * nous, le clic reste MUET tout le temps de l'aller-retour réseau du
   * morceau : react-router 7 enveloppe le changement d'URL dans
   * `startTransition` — littéralement, dans son `HashRouter` — et React 19
   * garde alors délibérément l'écran déjà affiché plutôt que de montrer le
   * repli de `<Suspense>` d'`App`. Ce repli est donc du CODE MORT AU CLIC : il
   * ne paraît que sur un atterrissage direct sur l'URL.
   *
   * Mesuré à froid le 20/09/2026 sur deux sites publiés du parc, première
   * visite : 133 ms d'écran figé sur mister-settle, 161 ms sur mister-molkky,
   * `aria-busy` faux d'un bout à l'autre.
   *
   * `enCours` reste vrai tant que le morceau n'est pas arrivé : c'est la seule
   * information qui manquait pour répondre au visiteur.
   */
  const versLEcran = (to: string) => {
    setCiblePendante(to);
    demarreLaTransition(() => nav(to));
  };

  /** La pastille de l'entrée cliquée tourne, les autres gardent la leur. */
  const pastille = (to: string, Icone: typeof Zap, taille: string) =>
    enCours && ciblePendante === to ? (
      <LoaderCircle className={`${taille} animate-spin`} />
    ) : (
      <Icone className={taille} />
    );
  const occupe = (to: string) =>
    enCours && ciblePendante === to ? true : undefined;
  const role = useGameStore(s => s.role);
  const sessionId = useGameStore(s => s.sessionId);
  const reset = useGameStore(s => s.reset);
  const profile = useProfile(s => s.profile);
  const resumePath =
    role && sessionId
      ? role === 'host'
        ? `/host/${sessionId}`
        : `/play/${sessionId}`
      : null;

  return (
    <Screen className="justify-center text-center">
      <h1 className="font-display text-5xl text-brand-soft">Mister Qowa</h1>
      <p className="mt-3 text-balance text-white/70">{t('home.subtitle')}</p>

      {profile.gamesPlayed > 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
          <p className="text-sm text-white/80">
            {profile.avatar ? <span aria-hidden>{profile.avatar} </span> : null}
            <span className="font-semibold">{profile.pseudo}</span>
            {' · '}
            {t('profile.summary', {
              games: profile.gamesPlayed,
              points: profile.totalPoints,
            })}
          </p>
          {profile.badges.length ? (
            <div className="flex flex-wrap justify-center gap-1.5">
              {profile.badges.map(b => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs"
                >
                  <span aria-hidden>{BADGE_EMOJI[b] ?? '⭐'}</span>
                  {t(`profile.badge.${b}` as 'profile.badge.firstGame')}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {resumePath ? (
        <div className="mt-8 flex flex-col items-center gap-1">
          <Button
            full
            onClick={() => versLEcran(resumePath)}
            aria-busy={occupe(resumePath)}
          >
            {pastille(resumePath, Play, 'size-5')} {t('home.resume')}
          </Button>
          <button
            type="button"
            onClick={reset}
            className="text-xs text-white/40 hover:text-white/70"
          >
            {t('home.quit')}
          </button>
        </div>
      ) : null}

      <div className="mt-10 flex flex-col gap-3">
        <Button
          full
          onClick={() => versLEcran('/create')}
          aria-busy={occupe('/create')}
        >
          {pastille('/create', Zap, 'size-5')} {t('home.host')}
        </Button>
        <Button
          full
          variant="ghost"
          onClick={() => versLEcran('/join')}
          aria-busy={occupe('/join')}
        >
          {pastille('/join', Users, 'size-5')} {t('home.join')}
        </Button>
        <Button
          full
          variant="ghost"
          onClick={() => versLEcran('/solo')}
          aria-busy={occupe('/solo')}
        >
          {pastille('/solo', Gamepad2, 'size-5')} {t('home.solo')}
        </Button>
      </div>
      {/* Deux entrées secondaires : l'historique, et le compte — la seule
          porte vers la déconnexion et la suppression, qui n'existaient
          nulle part. */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => versLEcran('/history')}
          aria-busy={occupe('/history')}
          className="inline-flex items-center justify-center gap-1.5 text-sm text-white/50 hover:text-white"
        >
          {pastille('/history', History, 'size-4')} {t('home.myGames')}
        </button>
        <button
          type="button"
          onClick={() => versLEcran('/account')}
          aria-busy={occupe('/account')}
          className="inline-flex items-center justify-center gap-1.5 text-sm text-white/50 hover:text-white"
        >
          {pastille('/account', UserCog, 'size-4')} {t('home.myAccount')}
        </button>
      </div>
      {/* HORS DES BOUTONS, pour ne pas changer leur nom accessible en cours de
          route : un lecteur d'écran annoncerait « Mes parties, chargement… »
          puis « Mes parties », sur le bouton qui a le focus. */}
      <span className="sr-only" role="status" aria-live="polite">
        {enCours ? t('home.loading') : ''}
      </span>
      {/* `dismissKey` REPREND LA CLÉ DU BANDEAU MAISON : le socle la lit comme
          un refus d'avant sa cadence et le traduit en report d'un mois, au lieu
          de reproposer l'installation à qui l'avait déjà écartée. */}
      <PwaInstallPrompt dismissKey="mister-qowa:install-dismissed" />
      <AppFooter />
    </Screen>
  );
}
