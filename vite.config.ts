import { defineConfig, type PluginOption } from "vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import { pwaSeoPlugin } from "@mister-guiiug/dev-pwa-config/vite-pwa-base";
import { cspPlugin } from "@mister-guiiug/dev-pwa-config/vite-csp";

const analyze = process.env.ANALYZE === "1";

// Déployé sur GitHub Pages : https://mister-guiiug.github.io/mister-qowa/
export default defineConfig(({ command }) => {
  // VITE_BASE_PATH d'abord : la CI Lighthouse du socle sert dist/ à la racine
  // (sinon NO_FCP, les assets partent chercher /mister-qowa/…).
  const base =
    process.env.VITE_BASE_PATH ?? (command === "build" ? "/mister-qowa/" : "/");
  return {
    base,
    resolve: {
      alias: {
        "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
      },
    },
    build: { sourcemap: true, chunkSizeWarningLimit: 900 },
    plugins: [
      react(),
      tailwindcss(),
      // Sitemap, robots, canonique, Open Graph — et deux <meta theme-color>
      // par schéma (relevé du 02/09/2026 : qowa n'avait rien de tout ça).
      pwaSeoPlugin({
        basePath: base,
        logoPath: "/icons/icon-512.png",
        themeColor: { light: "#7c3aed", dark: "#0f0a1e" },
      }),
      // CSP par hash (socle). connect-src : Firebase (Auth, Firestore, RTDB en
      // websocket, Functions) ; les polices Google viennent d'index.html.
      cspPlugin({
        dev: command === "serve",
        connectSrc: [
          "'self'",
          "https://*.googleapis.com",
          "https://*.firebaseio.com",
          "wss://*.firebaseio.com",
          "https://*.firebasedatabase.app",
          "wss://*.firebasedatabase.app",
          "https://*.cloudfunctions.net",
          "https://api.anthropic.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      }),
      VitePWA({
        registerType: "prompt",
        includeAssets: ["icons/icon.svg", "icons/apple-touch-icon.png"],
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,woff2,webmanifest}"],
          navigateFallback: "index.html",
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // Images de question (Firebase Storage) : URL immuable par fichier.
              urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "qowa-media",
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        manifest: {
          id: "/mister-qowa/",
          name: "Mister Qowa — Quiz en direct",
          short_name: "Mister Qowa",
          description:
            "Crée et joue des quiz interactifs en temps réel. Rejoins une partie avec un code PIN, réponds vite, grimpe au classement.",
          theme_color: "#7c3aed",
          background_color: "#0f0a1e",
          display: "standalone",
          orientation: "portrait",
          scope: base,
          start_url: base,
          lang: "fr",
          categories: ["education", "games"],
          // Les deux captures de la fiche d'installation, prises par
          // `pwa-screenshots` du socle sur un build (06/09/2026) : sans elles,
          // Chrome propose une ligne et un bouton au lieu d'une fiche.
          screenshots: [
            {
              src: "screenshots/narrow.png",
              sizes: "540x1170",
              type: "image/png",
              form_factor: "narrow",
              label: "L’application, sur téléphone",
            },
            {
              src: "screenshots/wide.png",
              sizes: "1280x720",
              type: "image/png",
              form_factor: "wide",
              label: "L’application, sur ordinateur",
            },
          ],
          icons: [
            {
              src: "icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "icons/icon-maskable.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
      }),
      ...(analyze
        ? [
            visualizer({
              filename: "dist/stats.html",
              gzipSize: true,
              brotliSize: true,
            }) as PluginOption,
          ]
        : []),
    ],
  };
});
