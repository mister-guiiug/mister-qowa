import { test, expect } from "@playwright/test";

test("créer un quiz dans l'éditeur @critical", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Héberger un quiz/ }).click();
  await page.getByRole("button", { name: /Nouveau/ }).click();

  await page.getByPlaceholder("Titre du quiz").fill("Quiz e2e");
  await page
    .getByLabel("Énoncé de la question 1")
    .fill("Capitale de la France ?");
  await page.getByLabel("Réponse 1").fill("Paris");
  await page.getByLabel("Réponse 2").fill("Londres");
  // Marque « Paris » comme bonne réponse (1er bouton radio).
  await page.getByLabel("Bonne réponse").first().check();

  await page.getByRole("button", { name: /Enregistrer le quiz/ }).click();

  // Retour à la bibliothèque : le quiz apparaît dans « Mes quiz ».
  await expect(page.getByText("Quiz e2e")).toBeVisible();
});
