import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Audit d'accessibilité automatisé (axe-core) sur les écrans 100 % locaux.
 * On échoue sur les violations « serious » et « critical » uniquement :
 * les niveaux minor/moderate sont remontés mais non bloquants.
 */
async function expectNoSeriousViolations(page: Page, screen: string) {
  const results = await new AxeBuilder({ page })
    // Cartes `backdrop-blur` (fonds translucides sur dégradé body) : axe ne sait
    // pas résoudre le fond → contraste non déterministe (faux positifs flaky en CI).
    // Les fonds OPAQUES (boutons de réponse…) restent couverts par le scan.
    .exclude(".backdrop-blur")
    .analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(
    blocking,
    `${screen} : ${blocking.map((v) => `${v.id} (${v.impact})`).join(", ")}`,
  ).toEqual([]);
}

test("a11y : accueil @critical", async ({ page }) => {
  await page.goto("/");
  await expectNoSeriousViolations(page, "Accueil");
});

test("a11y : rejoindre @critical", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Rejoindre une partie/ }).click();
  await expectNoSeriousViolations(page, "Rejoindre");
});

test("a11y : bibliothèque + éditeur @critical", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Héberger un quiz/ }).click();
  await expectNoSeriousViolations(page, "Bibliothèque");
  await page.getByRole("button", { name: /Nouveau/ }).click();
  await expectNoSeriousViolations(page, "Éditeur");
});

test("a11y : génération IA @critical", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Héberger un quiz/ }).click();
  await page.getByRole("button", { name: /Générer un quiz par IA/ }).click();
  await expectNoSeriousViolations(page, "Génération IA");
});

test("a11y : solo en jeu @critical", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Jouer en solo/ }).click();
  await page
    .getByRole("button", { name: /^Jouer$/ })
    .first()
    .click();
  await expectNoSeriousViolations(page, "Solo (question)");
});
