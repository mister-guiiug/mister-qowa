import { test, expect } from '@playwright/test';

/**
 * Le canal de retour, et le numéro qu'il faut pour s'en servir.
 *
 * La campagne du 06/09/2026 a posé `issues` sur huit apps du parc et raté
 * celle-ci : son codemod cherchait l'import du socle entre guillemets simples,
 * `FamilyLinks.tsx` l'écrit entre guillemets doubles. Un test vaut mieux qu'un
 * codemod plus malin — il ne dépend pas de la façon dont la ligne est écrite.
 *
 * SUR LE COMPTE, ET NULLE PART AILLEURS QU'AVEC L'ACCUEIL. Ce test a d'abord
 * vérifié l'inverse : les liens étaient rendus par la coquille, sur tous les
 * écrans. La règle famille du 06/09/2026 les réserve à l'accueil et aux
 * Réglages — ici, le Compte — et `FamilyLinks` a quitté la coquille le
 * 24/09/2026. Le test vérifie donc les deux moitiés de la règle : présents sur
 * le Compte, absents d'un écran de jeu (« Mes parties »).
 */
test('« Signaler un problème » est sur le Compte, et pas dans « Mes parties » @critical', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Mes parties/ }).click();
  await expect(page.locator('[data-dwc="footer-issues"]')).toHaveCount(0);
  await expect(page.locator('[data-dwc="footer-source"]')).toHaveCount(0);

  await page.goto('/');
  await page.getByRole('button', { name: /Mon compte/ }).click();

  const signaler = page.locator('[data-dwc="footer-issues"]');
  await expect(signaler).toBeVisible();
  await expect(signaler).toContainText('Signaler un problème');

  const href = await signaler.getAttribute('href');
  expect(href).toContain(
    'https://github.com/mister-guiiug/mister-qowa/issues/new'
  );
  // Le gabarit du dépôt `.github` du compte, et l'écran d'où l'on part : c'est
  // ce qui distingue ce lien d'un « ouvrir une issue » nu.
  expect(href).toContain('template=bug.yml');
  expect(href).toContain('environnement=');

  // Le code source aussi, sur le même écran.
  await expect(page.locator('[data-dwc="footer-source"]')).toBeVisible();
});

test("le pied de page n'affiche AUCUN numéro de version @critical", async ({
  page,
}) => {
  // Il en affichait un, lié vers `…/releases/tag/vX.Y.Z` : aucune app du parc
  // ne crée de tag git, et ce lien répondait 404. Le numéro n'a pas disparu du
  // canal qui en a besoin — `issue-report` le préremplit dans le rapport de
  // bug, ce que le test ci-dessus vérifie par `environnement=`.
  await page.goto('/');
  await expect(page.locator('[data-dwc="app-version-value"]')).toHaveCount(0);
});
