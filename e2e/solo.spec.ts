import { test, expect } from "@playwright/test";

test("partie solo complète @critical", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Jouer en solo/ }).click();

  // Lance le 1er quiz (démo « Culture générale express », 5 questions).
  await page
    .getByRole("button", { name: /^Jouer$/ })
    .first()
    .click();

  for (let i = 0; i < 5; i += 1) {
    // Répond (1re réponse) puis passe.
    await page.locator("button[aria-pressed]").first().click();
    await page.getByRole("button", { name: /Suivant|Voir le score/ }).click();
  }

  await expect(page.getByRole("heading", { name: /Terminé/ })).toBeVisible();
  await expect(page.getByText(/pts/).first()).toBeVisible();
});
