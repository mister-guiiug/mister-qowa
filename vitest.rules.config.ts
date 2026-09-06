import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

/**
 * Tests des Security Rules RTDB **et Firestore** — nécessitent l'émulateur :
 *   npm run test:rules   (firebase emulators:exec --only database,firestore …)
 * Volontairement HORS du run vitest principal (qui tourne sans émulateur).
 *
 * `fileParallelism: false` : les deux fichiers montent chacun leur
 * `RulesTestEnvironment` sur le MÊME `projectId`, et celui de Firestore appelle
 * `clearFirestore()` entre les cas. Les faire tourner en même temps, c'est
 * accepter qu'une purge tombe au milieu d'un autre fichier ; deux suites de
 * quelques secondes ne valent pas ce pari.
 */
export default defineConfig({
  resolve: {
    alias: { "@shared": fileURLToPath(new URL("./shared", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["rules-tests/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 30_000,
  },
});
