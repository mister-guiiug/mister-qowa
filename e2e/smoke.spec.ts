import { test, expect } from "@playwright/test";

test("navigation depuis l'accueil @critical", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Mister Qowa" }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Héberger un quiz/ }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Quiz" }),
  ).toBeVisible();
  await expect(page.getByText("Culture générale express")).toBeVisible();

  await page.getByRole("button", { name: /Accueil/ }).click();
  await page.getByRole("button", { name: /Jouer en solo/ }).click();
  await expect(
    page.getByRole("heading", { name: "Jouer en solo" }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Accueil/ }).click();
  await page.getByRole("button", { name: /Rejoindre une partie/ }).click();
  await expect(
    page.getByRole("heading", { name: "Rejoindre une partie" }),
  ).toBeVisible();
});
