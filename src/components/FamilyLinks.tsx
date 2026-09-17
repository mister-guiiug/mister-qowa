import { AppFooter } from '@mister-guiiug/dev-pwa-config/react/app-footer';
import { LabelsProvider } from '@mister-guiiug/dev-pwa-config/react/labels';
import {
  SPONSOR_URL,
  repoUrl,
} from '@mister-guiiug/dev-pwa-config/apps-catalog';
import { useT, useLang } from '../i18n';

/**
 * Les liens de la règle famille — code source, soutien, SIGNALEMENT — et le
 * numéro de version, rendus par la COQUILLE, hors des routes, donc sur tous
 * les écrans.
 *
 * POURQUOI UN COMPOSANT PLUTÔT QU'UN APPEL DIRECT DANS `App.tsx`. Les libellés
 * viennent de `useT()`, un hook : il lui faut un composant.
 *
 * Ils vivaient dans le pied de page de l'ACCUEIL, seul écran à le rendre : le
 * code source n'existait donc nulle part ailleurs dans l'application.
 *
 * Les URL viennent du catalogue famille (`apps-catalog`, module pur) :
 * `repoUrl('mister-qowa')` dérive l'adresse du dépôt de l'identifiant
 * catalogue, qui EST le nom du dépôt GitHub.
 *
 * « SIGNALER UN PROBLÈME » — CE QUI MANQUAIT ICI, ET POURQUOI. La campagne du
 * 06/09/2026 a posé `issues` sur huit apps et raté celle-ci : son codemod
 * cherchait l'import du socle entre guillemets SIMPLES, et ce fichier l'écrit
 * entre guillemets doubles (Prettier). Le dépôt, lui, était prêt — ses issues
 * sont ouvertes et le gabarit `bug.yml` répond. L'application était donc la
 * seule pièce manquante d'un canal de retour complet : `issue-report` du socle
 * remplit le gabarit avec la version, le commit, l'écran courant et le
 * navigateur, RECALCULÉS AU CLIC (la route change sans re-rendre ce pied de
 * page).
 *
 * PAS DE NUMÉRO DE VERSION. La prop `version` en posait un, lié vers
 * `…/releases/tag/vX.Y.Z` — or aucune app du parc ne crée de tag git, et le
 * lien répondait 404 partout. Le numéro n'a pas disparu du canal qui en a
 * besoin : `issue-report` le préremplit toujours dans le rapport de bug.
 *
 * `LabelsProvider` : le socle connaît SEPT langues depuis la 4.2.0, dont les
 * cinq de cette app. Les trois libellés que ce pied de page affiche lui sont
 * passés explicitement (`sourceLabel`, `sponsorLabel`, `issues.label` — mêmes
 * clés, même ton que le reste de l'écran) ; le fournisseur reste pour ce que
 * le socle ajouterait demain, dans la langue de l'utilisateur plutôt qu'en
 * français pour tout le monde.
 */
export function FamilyLinks() {
  const t = useT();
  const lang = useLang(s => s.lang);
  return (
    <LabelsProvider locale={lang}>
      <AppFooter
        className="justify-center px-4 pb-6 text-sm"
        repoUrl={repoUrl('mister-qowa')}
        sponsorUrl={SPONSOR_URL}
        sourceLabel={t('footer.source')}
        sponsorLabel={t('footer.support')}
        issues={{ label: t('footer.issues') }}
      />
    </LabelsProvider>
  );
}
