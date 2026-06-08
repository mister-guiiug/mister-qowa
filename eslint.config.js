// Config famille miss-* / mister- (flat config React 19). On ignore le dossier
// `functions/` (toolchain Cloud Functions séparée) et les sorties de build.
import base from "@mister-guiiug/dev-wpa-config/eslint-react";

export default [
  ...base,
  { ignores: ["functions/**", "dist/**", "dev-dist/**"] },
];
