import { test, expect } from "@playwright/test";

// Bascule de langue : FR par défaut → EN via le sélecteur, persistance au reload.
test("bascule de langue FR ↔ EN @critical", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /Héberger un quiz/ }),
  ).toBeVisible();

  // Bascule en anglais (le bouton du sélecteur a pour aria-label « English »).
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("button", { name: "Host a quiz" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Héberger un quiz/ }),
  ).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  // Le choix persiste après un rechargement.
  await page.reload();
  await expect(page.getByRole("button", { name: "Host a quiz" })).toBeVisible();

  // Une 3e langue (chargée à la demande) : espagnol.
  await page.getByRole("button", { name: "Español" }).click();
  await expect(
    page.getByRole("button", { name: "Crear un cuestionario" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");

  // Retour au français.
  await page.getByRole("button", { name: "Français" }).click();
  await expect(
    page.getByRole("button", { name: /Héberger un quiz/ }),
  ).toBeVisible();
});
