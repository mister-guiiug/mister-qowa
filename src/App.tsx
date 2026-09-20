import { lazy, Suspense, useEffect } from 'react';
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { LazyMotion, domMax, MotionConfig } from 'framer-motion';
import { ConsentBanner } from '@mister-guiiug/dev-pwa-config/react/consent-banner';
import { usePageViews } from '@mister-guiiug/dev-pwa-config/react/use-page-views';
import { Home } from './routes/Home';
import { UpdatePrompt } from './components/UpdatePrompt';
import { ConnectionBanner } from './components/ConnectionBanner';
import { FamilyLinks } from './components/FamilyLinks';
import { Spinner } from './lib/ui';
import { useLang, tStatic } from './i18n';
import { isConfigOk } from './firebase/env';
import { addBreadcrumb } from './lib/breadcrumbs';

// Code-splitting : seul l'accueil est chargé d'emblée ; les écrans qui tirent
// Firebase (host/join/play/historique) sont en chunks séparés, chargés à la demande.
// CHAQUE IMPORT D'UN ÉCRAN DE L'ACCUEIL EST NOMMÉ, parce qu'il sert DEUX FOIS :
// à `lazy` ci-dessous, et au préchargement à l'inactivité de
// `usePrechargeLesEcransDeLAccueil`. Deux `import()` du même spécificateur ne
// téléchargent qu'une fois — le registre de modules dédoublonne — mais encore
// faut-il que ce soit LITTÉRALEMENT le même spécificateur, sinon le bundler
// émet deux morceaux et le préchargement ne sert plus à rien.
const chargeCreate = () => import('./routes/Create');
const chargeJoin = () => import('./routes/Join');
const chargeSolo = () => import('./routes/Solo');
const chargeHistory = () => import('./routes/History');
const chargeAccount = () => import('./routes/Account');

/**
 * Les cinq écrans qu'un bouton de l'accueil atteint — et eux seuls.
 *
 * `Host`, `Play`, `QuizEditor`, `AiGenerate` et `TextImport` restent dehors :
 * on n'y arrive qu'une fois une partie ou un quiz engagé, jamais d'un clic
 * depuis l'accueil. Les précharger ferait payer à tout le monde ce que presque
 * personne n'ouvre au premier écran.
 */
const CHARGEURS_DE_L_ACCUEIL = [
  chargeCreate,
  chargeJoin,
  chargeSolo,
  chargeHistory,
  chargeAccount,
];

/** `navigator.connection` n'est pas dans les types du DOM : il reste un brouillon. */
type NavigateurEconome = Navigator & { connection?: { saveData?: boolean } };

/**
 * PRÉCHARGE LES ÉCRANS DE L'ACCUEIL DÈS QUE LE FIL PRINCIPAL SOUFFLE.
 *
 * Sans préchargement, le morceau d'un écran n'est demandé qu'AU CLIC : un
 * aller-retour réseau complet, payé au pire moment — pendant que le reste du
 * bundle arrive et que le service worker précharge ses entrées. Mesuré à froid
 * le 20/09/2026 sur deux sites publiés du parc, première visite : 133 ms sur
 * mister-settle, 161 ms sur mister-molkky, pendant lesquelles l'URL indique
 * déjà la nouvelle route et l'écran affiche encore l'ancien.
 *
 * N'entre PAS dans `bundleBudget.preloadGzipKb` : ce budget ne compte que ce
 * qui est `modulepreload` dans le document, et un `import()` tardif n'y entre
 * pas.
 */
function usePrechargeLesEcransDeLAccueil() {
  useEffect(() => {
    // `saveData` : le visiteur a demandé qu'on épargne son forfait. On ne
    // télécharge alors que ce qu'il demande vraiment — et c'est précisément
    // pour ce cas-là que l'accueil, lui, sait désormais dire qu'il charge.
    if ((navigator as NavigateurEconome).connection?.saveData) return;

    let annule = false;
    const precharge = () => {
      if (annule) return;
      // Un échec ici est sans conséquence : au clic, `lazy` redemandera le
      // morceau et c'est LUI qui portera l'erreur, dans son propre `Suspense`.
      for (const charge of CHARGEURS_DE_L_ACCUEIL)
        void charge().catch(() => {});
    };

    // `requestIdleCallback` manque encore à Safari avant la 17 ; le repli
    // minuté vaut mieux que rien.
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(precharge, { timeout: 3000 });
      return () => {
        annule = true;
        window.cancelIdleCallback?.(id);
      };
    }
    const id = window.setTimeout(precharge, 1200);
    return () => {
      annule = true;
      window.clearTimeout(id);
    };
  }, []);
}

const Create = lazy(() => chargeCreate().then(m => ({ default: m.Create })));
const QuizEditor = lazy(() =>
  import('./routes/QuizEditor').then(m => ({ default: m.QuizEditor }))
);
const AiGenerate = lazy(() =>
  import('./routes/AiGenerate').then(m => ({ default: m.AiGenerate }))
);
const TextImport = lazy(() =>
  import('./routes/TextImport').then(m => ({ default: m.TextImport }))
);
const Host = lazy(() =>
  import('./routes/Host').then(m => ({ default: m.Host }))
);
const Join = lazy(() => chargeJoin().then(m => ({ default: m.Join })));
const Play = lazy(() =>
  import('./routes/Play').then(m => ({ default: m.Play }))
);
const Solo = lazy(() => chargeSolo().then(m => ({ default: m.Solo })));
const History = lazy(() => chargeHistory().then(m => ({ default: m.History })));
const Account = lazy(() => chargeAccount().then(m => ({ default: m.Account })));

/**
 * Ce que le changement de route déclenche, et qui ne rend rien.
 *
 * Deux usages, un seul endroit : le fil d'Ariane du diagnostic d'erreur, et la
 * vue de page. Les séparer en deux composants ferait deux abonnements à la
 * même valeur pour le même évènement.
 *
 * `usePageViews` ne fait rien tant que le consentement n'est pas accordé — il
 * se monte donc sans condition. Sans lui, toute la navigation du quiz serait
 * invisible ; et si on laissait PostHog compter seul, chaque navigation serait
 * comptée DEUX fois — il envoie une vue au chargement ET à chaque changement
 * d'historique. `initAnalytics` pose donc `capture_pageview: false` pour que
 * toutes passent par ici, la première comprise.
 */
function RouteBreadcrumbs() {
  const loc = useLocation();
  usePageViews(loc.pathname);
  useEffect(() => {
    addBreadcrumb('route', loc.pathname);
  }, [loc.pathname]);
  return null;
}

/** Écran bloquant si la config n'est pas exploitable (App Check requis manquant). */
function ConfigError() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="font-display text-2xl">{tStatic('err.configTitle')}</p>
      <p className="max-w-sm text-white/60">{tStatic('err.appCheckMissing')}</p>
    </div>
  );
}

export function App() {
  usePrechargeLesEcransDeLAccueil();
  const lang = useLang(s => s.lang);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Fail-safe : si App Check est requis mais non configuré, on ne démarre pas
  // le jeu sans protection (dormant tant que VITE_REQUIRE_APPCHECK n'est pas "true").
  if (!isConfigOk()) return <ConfigError />;

  return (
    // LazyMotion strict : seuls les composants `m.*` sont autorisés (bundle réduit) ;
    // domMax requis pour les animations `layout` du Leaderboard.
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">
        <HashRouter>
          <RouteBreadcrumbs />
          {/* Un seul bandeau réseau pour toute l'app. En TÊTE du document, donc
              au-dessus de l'écran courant et jamais par-dessus lui ; les deux
              autres invites (mise à jour, installation) sont ancrées en bas. */}
          <ConnectionBanner />
          <Suspense
            fallback={
              <div className="flex min-h-dvh items-center justify-center">
                <Spinner />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<Create />} />
              <Route path="/create/ai" element={<AiGenerate />} />
              <Route path="/create/text" element={<TextImport />} />
              <Route path="/create/new" element={<QuizEditor />} />
              <Route path="/create/:quizId" element={<QuizEditor />} />
              <Route path="/host/:sessionId" element={<Host />} />
              <Route path="/join" element={<Join />} />
              <Route path="/play/:sessionId" element={<Play />} />
              <Route path="/solo" element={<Solo />} />
              <Route path="/history" element={<History />} />
              <Route path="/account" element={<Account />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          {/* HORS des routes : le code source et le soutien sont ainsi sur
              TOUS les écrans, et plus seulement sur l'accueil — la règle
              famille. Les libellés viennent de l'i18n de l'app, qui connaît
              cinq langues là où le socle en connaît deux. */}
          <FamilyLinks />
          {/* Une `region`, pas une boîte modale : elle ne recouvre rien et ne
              piège pas le focus — un bandeau qui bloquerait une partie en cours
              serait exactement le « dark pattern » que le RGPD nomme. Ne rend
              RIEN tant que `VITE_POSTHOG_KEY` n'est pas posée. */}
          <ConsentBanner
            posthogKey={import.meta.env.VITE_POSTHOG_KEY}
            loader={() => import('posthog-js/dist/module.slim.js')}
          />
          <UpdatePrompt />
          {/* L'INVITE D'INSTALLATION A QUITTÉ LA COQUILLE pour l'accueil. Le
              bandeau maison était une barre flottante, celui du socle est un
              élément de flux : le laisser ici le poserait au hasard du dernier
              écran rendu. Et il paraîtrait par-dessus une partie en cours,
              alors que sur l'accueil le joueur est au repos. */}
        </HashRouter>
      </MotionConfig>
    </LazyMotion>
  );
}
