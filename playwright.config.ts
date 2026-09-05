import { defineConfig, devices } from "@playwright/test";
import { definePwaPlaywrightConfig } from "@mister-guiiug/dev-pwa-config/playwright-base";

// Factory famille : matrice navigateurs, reporters, webServer (`npm run dev`, port 5173).
// Les e2e couvrent les flux 100 % locaux (navigation, solo, éditeur) — sans backend.
export default defineConfig(
  definePwaPlaywrightConfig({ devices, testMatch: /.*\.spec\.ts$/ }),
);
