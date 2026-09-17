import { test, expect } from "@playwright/test";

/**
 * Le canal de retour, et le numéro qu'il faut pour s'en servir.
 *
 * La campagne du 06/09/2026 a posé `issues` sur huit apps du parc et raté
 * celle-ci : son codemod cherchait l'import du socle entre guillemets simples,
 * `FamilyLinks.tsx` l'écrit entre guillemets doubles. Un test vaut mieux qu'un
 * codemod plus malin — il ne dépend pas de la façon dont la ligne est écrite.
 *
 * SUR UN AUTRE ÉCRAN QUE L'ACCUEIL, délibérément : ce pied de page est rendu
 * par la COQUILLE, hors des routes. C'est toute la différence avec la version
 * précédente, où les liens famille n'existaient que sur l'accueil — donc jamais
 * sur l'écran où l'on rencontre le problème qu'on veut signaler.
 */
test("« Signaler un problème » est présent hors de l'accueil @critical", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Mes parties/ }).click();

  const signaler = page.locator('[data-dwc="footer-issues"]');
  await expect(signaler).toBeVisible();
  await expect(signaler).toContainText("Signaler un problème");

  const href = await signaler.getAttribute("href");
  expect(href).toContain(
    "https://github.com/mister-guiiug/mister-qowa/issues/new",
  );
  // Le gabarit du dépôt `.github` du compte, et l'écran d'où l'on part : c'est
  // ce qui distingue ce lien d'un « ouvrir une issue » nu.
  expect(href).toContain("template=bug.yml");
  expect(href).toContain("environnement=");

  // Le code source aussi, sur le même écran : lui non plus n'était nulle part
  // ailleurs que sur l'accueil.
  await expect(page.locator('[data-dwc="footer-source"]')).toBeVisible();
});

test("le pied de page n'affiche AUCUN numéro de version @critical", async ({
  page,
}) => {
  // Il en affichait un, lié vers `…/releases/tag/vX.Y.Z` : aucune app du parc
  // ne crée de tag git, et ce lien répondait 404. Le numéro n'a pas disparu du
  // canal qui en a besoin — `issue-report` le préremplit dans le rapport de
  // bug, ce que le test ci-dessus vérifie par `environnement=`.
  await page.goto("/");
  await expect(page.locator('[data-dwc="app-version-value"]')).toHaveCount(0);
});
