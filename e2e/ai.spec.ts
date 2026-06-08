import { test, expect } from "@playwright/test";

// Couvre le rendu de l'écran IA et ses validations LOCALES (aucun appel réseau :
// la génération échoue avant le fetch tant que sujet/clé manquent).
test("écran de génération IA : rendu et garde-fous @critical", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Héberger un quiz/ }).click();
  await page.getByRole("button", { name: /Générer un quiz par IA/ }).click();

  await expect(
    page.getByRole("heading", { name: /Générer par IA/ }),
  ).toBeVisible();

  // Sélecteur de fournisseur (BYOK).
  await expect(
    page.getByRole("button", { name: "Google Gemini" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Anthropic Claude" }),
  ).toBeVisible();

  // Générer sans sujet → erreur, pas de navigation.
  await page.getByRole("button", { name: /Générer le quiz/ }).click();
  await expect(page.getByText(/Indique un sujet/)).toBeVisible();

  // Sujet renseigné mais pas de clé → erreur dédiée.
  await page.getByLabel("Sujet du quiz").fill("Les volcans");
  await page.getByRole("button", { name: /Générer le quiz/ }).click();
  await expect(page.getByText(/Renseigne ta clé API/)).toBeVisible();
});
