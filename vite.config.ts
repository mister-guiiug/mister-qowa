import { defineConfig, type PluginOption } from "vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";

const analyze = process.env.ANALYZE === "1";

// Déployé sur GitHub Pages : https://mister-guiiug.github.io/mister-qowa/
export default defineConfig(({ command }) => {
  const base = command === "build" ? "/mister-qowa/" : "/";
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
