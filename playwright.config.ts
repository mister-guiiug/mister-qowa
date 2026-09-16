import { defineConfig, devices } from "@playwright/test";
import { definePwaPlaywrightConfig } from "@mister-guiiug/dev-pwa-config/playwright-base";

// Factory famille : matrice navigateurs, reporters, webServer (`npm run dev`, port 5173).
// Les e2e couvrent les flux 100 % locaux (navigation, solo, éditeur) — sans backend.
export default defineConfig(
  definePwaPlaywrightConfig({
    devices,
    testMatch: /.*\.spec\.ts$/,
    // Identifiant de mesure FACTICE : sans lui, `ConsentBanner` ne rend rien et
    // la garde de `entree.spec.ts` n'a rien à vérifier. Il ne touche que le
    // serveur de test ; la production garde sa variable de dépôt.
    command:
      "cross-env VITE_GA_MEASUREMENT_ID=G-E2E0000000 npm run dev -- --port 5173 --strictPort",
  }),
);
