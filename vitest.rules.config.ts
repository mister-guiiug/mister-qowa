import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

/**
 * Tests des Security Rules RTDB — nécessitent l'émulateur Firebase :
 *   npm run test:rules   (firebase emulators:exec --only database …)
 * Volontairement HORS du run vitest principal (qui tourne sans émulateur).
 */
export default defineConfig({
  resolve: {
    alias: { "@shared": fileURLToPath(new URL("./shared", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["rules-tests/**/*.test.ts"],
    testTimeout: 15_000,
    hookTimeout: 30_000,
  },
});
