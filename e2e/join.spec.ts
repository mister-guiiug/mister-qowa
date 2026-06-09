import { test, expect } from "@playwright/test";

// UI locale de l'écran Rejoindre : sélecteur d'avatar + PIN segmenté (sans backend).
test("écran Rejoindre : avatar + PIN segmenté @critical", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Rejoindre une partie/ }).click();
  await expect(
    page.getByRole("heading", { name: "Rejoindre une partie" }),
  ).toBeVisible();

  // Sélecteur d'avatars présent et sélectionnable.
  const avatars = page.getByRole("button", { name: /^Avatar / });
  await expect(avatars.first()).toBeVisible();
  await avatars.nth(1).click();
  await expect(avatars.nth(1)).toHaveAttribute("aria-pressed", "true");

  // Le PIN segmenté reflète la progression via l'aria-label dynamique.
  await page.getByLabel(/Code PIN/).fill("1234");
  await expect(page.getByLabel("Code PIN, 4 sur 8 chiffres")).toBeVisible();
});
