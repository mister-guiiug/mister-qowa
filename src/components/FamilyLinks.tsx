import { AppFooter } from "@mister-guiiug/dev-pwa-config/react/app-footer";
import {
  SPONSOR_URL,
  repoUrl,
} from "@mister-guiiug/dev-pwa-config/apps-catalog";
import { useT } from "../i18n";

/**
 * Les deux liens de la règle famille — code source et soutien — rendus par la
 * COQUILLE, hors des routes, donc sur tous les écrans.
 *
 * POURQUOI UN COMPOSANT PLUTÔT QU'UN APPEL DIRECT DANS `App.tsx`. Les libellés
 * viennent de `useT()`, un hook : il lui faut un composant. L'app traduit en
 * cinq langues là où le socle en connaît deux, et ses libellés doivent gagner.
 *
 * Ils vivaient dans le pied de page de l'ACCUEIL, seul écran à le rendre : le
 * code source n'existait donc nulle part ailleurs dans l'application.
 *
 * Les URL viennent du catalogue famille (`apps-catalog`, module pur) :
 * `repoUrl('mister-qowa')` dérive l'adresse du dépôt de l'identifiant
 * catalogue, qui EST le nom du dépôt GitHub.
 */
export function FamilyLinks() {
  const t = useT();
  return (
    <AppFooter
      className="justify-center px-4 pb-6 text-sm text-white/50"
      repoUrl={repoUrl("mister-qowa")}
      sponsorUrl={SPONSOR_URL}
      sourceLabel={t("footer.source")}
      sponsorLabel={t("footer.support")}
    />
  );
}
