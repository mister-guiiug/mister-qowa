import {
  defineConfig,
  devices,
  type PlaywrightTestConfig,
} from '@playwright/test';
import { definePwaPlaywrightConfig } from '@mister-guiiug/dev-pwa-config/playwright-base';

// Factory famille : matrice navigateurs, reporters, webServer (`npm run dev`, port 5173).
// Les e2e couvrent les flux 100 % locaux (navigation, solo, éditeur) — sans backend.
const base = definePwaPlaywrightConfig({
  devices,
  testMatch: /.*\.spec\.ts$/,
  // Identifiant de mesure FACTICE : sans lui, `ConsentBanner` ne rend rien et
  // la garde de `entree.spec.ts` n'a rien à vérifier. Il ne touche que le
  // serveur de test ; la production garde sa variable de dépôt.
  command:
    'node scripts/with-env.mjs VITE_POSTHOG_KEY=phc_e2e0000000000000000000000 -- npm run dev -- --port 5173 --strictPort',
}) as PlaywrightTestConfig;

export default defineConfig({
  ...base,
  webServer: [
    ...[base.webServer ?? []].flat(),
    /*
     * UN SECOND SERVEUR, POUR LA BUILD DE PRODUCTION — celui de
     * `e2e/hors-ligne.spec.ts`. Le serveur de développement n'a ni service
     * worker ni découpage en morceaux : c'est pourtant là que le site s'est
     * cassé hors ligne le 05/11/2026 (React rangé dans le morceau Sentry, hors
     * du précache), et aucune spec ne pouvait le voir.
     *
     * `vite build` et pas `npm run build` : le contrôle des types et le budget
     * ont leurs propres étapes en CI, et `tsc -b` écrit des `.js` dans `src/`
     * sur un poste de travail. Jamais réutilisé : un `vite preview` resté
     * ouvert servirait une build périmée.
     */
    {
      command: 'npx vite build && npm run preview -- --port 4173 --strictPort',
      url: 'http://localhost:4173/mister-qowa/',
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
