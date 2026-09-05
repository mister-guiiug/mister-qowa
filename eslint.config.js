// Config famille miss-* / mister- (flat config React 19). On ignore le dossier
// `functions/` (toolchain Cloud Functions séparée), les sorties de build et le
// rapport de couverture (`coverage/`, assets JS générés par le rapporteur v8).
import base from "@mister-guiiug/dev-pwa-config/eslint-react";

export default [
  ...base,
  { ignores: ["functions/**", "dist/**", "dev-dist/**", "coverage/**"] },
];
