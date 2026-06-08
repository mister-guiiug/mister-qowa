import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { baseTestOptions } from "@mister-guiiug/dev-wpa-config/vitest-base";

// Tests jsdom (composants) + tests Node purs (shared/: moteur de score, contrats).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@shared": fileURLToPath(new URL("./shared", import.meta.url)) },
  },
  test: {
    ...baseTestOptions,
    include: ["src/**/*.{test,spec}.{ts,tsx}", "shared/**/*.{test,spec}.ts"],
    exclude: ["**/node_modules/**", "**/functions/**", "**/dist/**"],
  },
});
