import { defineConfig, type PluginOption } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import { pwaSeoPlugin } from '@mister-guiiug/dev-pwa-config/vite-pwa-base';
import { cspPlugin } from '@mister-guiiug/dev-pwa-config/vite-csp';
import { versionPlugin } from '@mister-guiiug/dev-pwa-config/vite-version';
import { NAVIGATE_FALLBACK_DENY_FILES } from '@mister-guiiug/dev-pwa-config/vite-pwa';

const analyze = process.env.ANALYZE === '1';

// Déployé sur GitHub Pages : https://mister-guiiug.github.io/mister-qowa/
export default defineConfig(({ command }) => {
  // VITE_BASE_PATH d'abord : la CI Lighthouse du socle sert dist/ à la racine
  // (sinon NO_FCP, les assets partent chercher /mister-qowa/…).
  const base =
    process.env.VITE_BASE_PATH ?? (command === 'build' ? '/mister-qowa/' : '/');
  return {
    base,
    resolve: {
      alias: {
        '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
      },
    },
    build: {
      sourcemap: true,
      chunkSizeWarningLimit: 900,
      /*
       * NOMMER N'EST PAS PRÉCHARGER, et il faut les deux options pour les
       * séparer. Le groupe `codeSplitting` donne au morceau Sentry un NOM
       * stable — sans règle, Rollup le nomme d'après le module (`esm-*`),
       * instable d'une version à l'autre : le `globIgnores` du service
       * worker n'aurait pas de cible fiable. Mais nommer un morceau le fait
       * entrer dans la liste de `modulepreload` de l'entrée — mesuré le
       * 16/09/2026 sur miss-ticket-pwa, 435,4 kB préchargés au lieu de
       * 280,1. `resolveDependencies` l'en retire.
       *
       * ET IL FAUT UNE TROISIÈME OPTION, parce que les deux premières
       * fabriquaient une URL QUI MEURT À CHAQUE DÉPLOIEMENT.
       *
       * Le morceau Sentry est le SEUL que l'entrée référence sans qu'il soit
       * précaché — c'était le but. Mais son nom de fichier portait une
       * empreinte de contenu : `sentry-EYLFX1f0.js`. Le service worker sert la
       * coquille précachée jusqu'à ce que l'utilisateur accepte la mise à
       * jour ; cette coquille-là demande l'ANCIENNE empreinte, que le
       * déploiement suivant a supprimée de `assets/`. Résultat mesuré le
       * 22/09/2026 sur le site en ligne : HTTP 404, et « Échec du chargement
       * pour le module » dans la console. `initSentry` avale l'échec (son
       * `try/catch`), donc l'application ne casse pas — elle rapporte
       * simplement ses erreurs à personne, sans le dire.
       *
       * Un nom SANS empreinte supprime la cause : l'URL ne change plus, le
       * déploiement écrase le fichier, et la coquille périmée charge la version
       * courante. Rien n'est perdu au cache, parce qu'il n'y avait rien à
       * gagner : GitHub Pages répond `Cache-Control: max-age=600` sur TOUS les
       * fichiers, empreinte ou pas — mesuré, pas supposé.
       *
       * Les trois options se lisent ensemble ou pas du tout : le filtre de
       * `modulePreload` et le `globIgnores` visaient `sentry-*`, motif que ce
       * fichier ne porte plus. Ils acceptent désormais les deux formes, pour
       * qu'un retour de l'empreinte ne les rende pas muets en silence.
       */
      modulePreload: {
        resolveDependencies: (_fichier: string, deps: string[]) =>
          deps.filter(d => !/(^|\/)sentry(-[\w-]+)?\.js$/.test(d)),
      },
      rollupOptions: {
        output: {
          /*
           * REACT HORS DU MORCEAU SENTRY, PAR UN GROUPE QUI PASSE AVANT LUI.
           *
           * Le morceau était posé par `manualChunks`, que Rolldown traduit en
           * un groupe de `codeSplitting`… qui capture aussi, par défaut
           * (`includeDependenciesRecursively`), les DÉPENDANCES des modules
           * qu'il prend. `@sentry/react` importe `react` : React est parti dans
           * `sentry.js` (450 kB, `react.transitional.element` dedans), et
           * l'entrée a commencé par `import{n}from"./sentry.js"`. Ce fichier
           * étant hors du précache, le site ne démarrait plus hors ligne —
           * constaté en production le 05/11/2026, rejoué depuis par
           * `e2e/hors-ligne.spec.ts`. Les applications du parc qui rangent
           * React à part (`react-vendor`) y échappaient sans le savoir.
           *
           * Le groupe `react`, de priorité plus haute, prend React le premier ;
           * le groupe `sentry` ne peut plus l'emporter. React est la seule
           * dépendance que Sentry partage avec l'application : c'est son pair.
           *
           * LA RÉCURSION EST GARDÉE, et c'est voulu. Coupée
           * (`includeDependenciesRecursively: false`), elle laissait
           * `web-vitals` — dépendance de `@sentry/browser-utils` — dans un
           * morceau à part, avec la façade de l'`import()` : ce morceau
           * importait `sentry.js`, qui l'importait en retour. Un cycle entre
           * morceaux, mesuré le 05/11/2026, et que seul un DSN posé aurait
           * exécuté.
           */
          codeSplitting: {
            groups: [
              {
                name: 'react',
                test: /[\\/]node_modules[\\/]react[\\/]/,
                priority: 1,
              },
              {
                name: 'sentry',
                test: /[\\/]node_modules[\\/]@sentry[\\/]/,
              },
            ],
          },
          chunkFileNames: chunk =>
            chunk.name === 'sentry'
              ? 'assets/sentry.js'
              : 'assets/[name]-[hash].js',
        },
      },
    },
    plugins: [
      // AVANT cspPlugin : il pose un script inline dans le <head>, que la
      // CSP doit hacher après coup ; et il écrit version.json au build.
      versionPlugin({ manifest: true }),
      react(),
      tailwindcss(),
      // Sitemap, robots, canonique, Open Graph — et deux <meta theme-color>
      // par schéma (relevé du 02/09/2026 : qowa n'avait rien de tout ça).
      pwaSeoPlugin({
        basePath: base,
        logoPath: '/icons/icon-512.png',
        themeColor: { light: '#7c3aed', dark: '#0f0a1e' },
      }),
      // CSP par hash (socle). connect-src : Firebase (Auth, Firestore, RTDB en
      // websocket, Functions) ; les polices Google viennent d'index.html.
      cspPlugin({
        dev: command === 'serve',
        // Ouvre les hôtes de PostHog — le nuage EUROPÉEN (ADR 0012). Sans
        // cette option, l'ingestion que `ConsentBanner` déclenche APRÈS
        // l'accord serait refusée par la politique — et l'échec ne se verrait
        // qu'en console, sur le site déployé, une fois le consentement donné.
        analytics: true,
        connectSrc: [
          "'self'",
          'https://*.googleapis.com',
          'https://*.firebaseio.com',
          'wss://*.firebaseio.com',
          'https://*.firebasedatabase.app',
          'wss://*.firebasedatabase.app',
          'https://*.cloudfunctions.net',
          'https://api.anthropic.com',
        ],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
      }),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
        workbox: {
          // Un fichier (sitemap.xml, llms.txt…) va au réseau, pas à index.html.
          navigateFallbackDenylist: [NAVIGATE_FALLBACK_DENY_FILES],
          globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
          /*
           * LE MORCEAU SENTRY HORS DU PRÉCACHE, sans quoi le découpage ne servirait
           * à rien : Workbox ramasse TOUT le JS émis, `import()` ou pas. Mesuré le
           * 16/09/2026 sur la production de deux apps du parc, 345 et 463 KiB de SDK
           * téléchargés par chaque visiteur, sans qu'aucun DSN soit posé.
           *
           * Hors précache, il part au premier `initSentry` réussi, et jamais si
           * l'observabilité reste éteinte : rapporter une erreur demande le réseau.
           *
           * Le motif accepte les DEUX formes de nom. Le fichier s'appelle
           * désormais `sentry.js`, sans empreinte (cf. `chunkFileNames` plus
           * haut, et le 404 qu'elle causait à chaque déploiement) ; `sentry-*`
           * reste accepté pour qu'un retour de l'empreinte ne fasse pas entrer
           * 158 kB de SDK dans le précache sans que rien ne le signale.
           */
          globIgnores: ['**/sentry.js', '**/sentry-*.js'],
          navigateFallback: 'index.html',
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // Images de question (Firebase Storage) : URL immuable par fichier.
              urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'qowa-media',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            /*
             * LES POLICES GOOGLE, chargées par `index.html` et que rien ne
             * gardait : hors ligne, l'app retombait sur les polices système
             * (audit du 05/11/2026). Deux hôtes, deux régimes. La feuille de
             * style varie selon le navigateur, on la sert du cache en la
             * rafraîchissant ; les fichiers de `fonts.gstatic.com` portent une
             * URL versionnée, ils ne changent jamais. Le `<link>` n'a pas de
             * `crossorigin` : la feuille arrive OPAQUE (statut 0), d'où le 0.
             */
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'qowa-google-fonts-css',
                expiration: { maxEntries: 10 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'qowa-google-fonts',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        manifest: {
          id: '/mister-qowa/',
          name: 'Mister Qowa — Quiz en direct',
          short_name: 'Mister Qowa',
          description:
            'Crée et joue des quiz interactifs en temps réel. Rejoins une partie avec un code PIN, réponds vite, grimpe au classement.',
          theme_color: '#7c3aed',
          background_color: '#0f0a1e',
          display: 'standalone',
          orientation: 'portrait',
          scope: base,
          start_url: base,
          lang: 'fr',
          categories: ['education', 'games'],
          // Les deux captures de la fiche d'installation, prises par
          // `pwa-screenshots` du socle sur un build (06/09/2026) : sans elles,
          // Chrome propose une ligne et un bouton au lieu d'une fiche.
          screenshots: [
            {
              src: 'screenshots/narrow.png',
              sizes: '540x1170',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'L’application, sur téléphone',
            },
            {
              src: 'screenshots/wide.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'L’application, sur ordinateur',
            },
          ],
          icons: [
            {
              src: 'icons/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icons/icon-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
      ...(analyze
        ? [
            visualizer({
              filename: 'dist/stats.html',
              gzipSize: true,
              brotliSize: true,
            }) as PluginOption,
          ]
        : []),
    ],
  };
});
