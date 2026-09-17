import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { installGlobalErrorHandlers } from './lib/report';
import './index.css';
import { initSentry } from '@mister-guiiug/dev-pwa-config/react/observability';

/*
 * L'OBSERVABILITÉ, ET ELLE NE COÛTE RIEN TANT QU'AUCUN DSN N'EST POSÉ.
 *
 * `initSentry` sort sur `if (!dsn) return null` AVANT d'importer le SDK :
 * sans `VITE_SENTRY_DSN` sur le dépôt, `@sentry/react` n’est jamais
 * téléchargé. Le morceau est en plus tenu hors du précache du service
 * worker (cf. `globIgnores` dans vite.config.ts), sans quoi Workbox le
 * ferait descendre chez chaque visiteur — mesuré le 16/09/2026 sur deux
 * apps du parc, 345 et 463 KiB pour une observabilité éteinte.
 *
 * `Sentry.init` pose ses propres gestionnaires globaux : les erreurs non
 * rattrapées et les rejets de promesse partent sans autre câblage.
 */
void initSentry({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  // `loader` rend l’import analysable par Vite, ce qui permet au
  // `manualChunks` de ranger le SDK dans son propre morceau.
  loader: () => import('@sentry/react'),
});

installGlobalErrorHandlers();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Élément racine #root introuvable.');

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
