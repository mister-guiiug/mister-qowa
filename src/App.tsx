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
const Create = lazy(() =>
  import('./routes/Create').then(m => ({ default: m.Create }))
);
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
const Join = lazy(() =>
  import('./routes/Join').then(m => ({ default: m.Join }))
);
const Play = lazy(() =>
  import('./routes/Play').then(m => ({ default: m.Play }))
);
const Solo = lazy(() =>
  import('./routes/Solo').then(m => ({ default: m.Solo }))
);
const History = lazy(() =>
  import('./routes/History').then(m => ({ default: m.History }))
);
const Account = lazy(() =>
  import('./routes/Account').then(m => ({ default: m.Account }))
);

/**
 * Ce que le changement de route déclenche, et qui ne rend rien.
 *
 * Deux usages, un seul endroit : le fil d'Ariane du diagnostic d'erreur, et la
 * vue de page GA4. Les séparer en deux composants ferait deux abonnements à la
 * même valeur pour le même évènement.
 *
 * `usePageViews` ne fait rien tant que le consentement n'est pas accordé — il
 * se monte donc sans condition. Sans lui, GA4 ne compterait qu'une vue par
 * chargement de document : toute la navigation du quiz serait invisible, et
 * `initAnalytics` pose en plus `send_page_view: false` pour que la première vue
 * passe par ici comme les autres.
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
              RIEN tant que `VITE_GA_MEASUREMENT_ID` n'est pas posée. */}
          <ConsentBanner
            gaMeasurementId={import.meta.env.VITE_GA_MEASUREMENT_ID}
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
