import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import {
  baseTestOptions,
  coveragePreset,
  pwaRegisterAlias,
} from "@mister-guiiug/dev-wpa-config/vitest-base";

// Tests jsdom (composants) + tests Node purs (shared/: moteur de score, contrats).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
      // `virtual:pwa-register` n'est fourni que par vite-plugin-pwa, absent
      // d'ici. Le double du socle est PILOTABLE (`swStub.needRefresh()`), là
      // où la copie locale était muette.
      ...pwaRegisterAlias,
    },
  },
  test: {
    ...baseTestOptions,
    include: ["src/**/*.{test,spec}.{ts,tsx}", "shared/**/*.{test,spec}.ts"],
    exclude: ["**/node_modules/**", "**/functions/**", "**/dist/**"],
    coverage: {
      ...coveragePreset,
      provider: "v8" as const, // le preset JS type `provider` en string large
      // Planchers calés sous la couverture mesurée (64/56/66/66) :
      // à MONTER au fil des tests, jamais à baisser pour faire passer le rouge.
      thresholds: { statements: 60, branches: 50, functions: 60, lines: 60 },
    },
  },
});
