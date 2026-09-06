import { test, expect } from "@playwright/test";

/**
 * « Mon compte » : la porte de sortie, et le cran de sûreté devant elle.
 *
 * CE QUI N'EST PAS TESTÉ ICI, ET POURQUOI. La suppression elle-même touche
 * Firebase Auth et Firestore ; les e2e de cette app tournent SANS backend (voir
 * `playwright.config.ts`). Ce qui se vérifie ici est ce qui appartient au
 * navigateur : que l'écran soit atteignable, que la liste de ce qui part soit
 * affichée avant le bouton, et surtout que le bouton reste HORS D'ATTEINTE tant
 * que le mot n'est pas saisi. Le reste — l'ordre purge-puis-suppression,
 * `auth/requires-recent-login` — est couvert par `src/lib/account.test.ts`, et
 * les règles qui autorisent la purge par `rules-tests/firestore.rules.test.ts`.
 */
test("mon compte : le geste délibéré arme la suppression @critical", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Mon compte/ }).click();

  await expect(
    page.getByRole("heading", { level: 1, name: "Mon compte" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Zone dangereuse/ }),
  ).toBeVisible();

  // Ce qui part est ÉNUMÉRÉ, pas résumé en « toutes vos données ».
  await expect(page.getByText(/parties que tu as hébergées/)).toBeVisible();
  await expect(page.getByText(/quiz dont tu es le propriétaire/)).toBeVisible();

  // Le cran de sûreté : fermé tant que le mot n'est pas là.
  const supprimer = page.getByRole("button", {
    name: "Supprimer définitivement",
  });
  await expect(supprimer).toBeDisabled();

  // Un mot approchant ne suffit pas.
  const champ = page.getByRole("textbox");
  await champ.fill("SUPPRIME");
  await expect(supprimer).toBeDisabled();

  await champ.fill("SUPPRIMER");
  await expect(supprimer).toBeEnabled();

  // Et la déconnexion, qui n'existait nulle part dans l'app, est là — avec
  // l'avertissement qui la distingue d'une sortie de secours.
  await expect(
    page.getByRole("heading", { name: "Se déconnecter" }),
  ).toBeVisible();
  await expect(page.getByText(/ne se retrouve pas/)).toBeVisible();
});

test("le mot de confirmation suit la langue @critical", async ({ page }) => {
  // Un utilisateur qui lit l'avertissement en anglais ne doit pas avoir à
  // deviner un mot français pour confirmer.
  await page.goto("/");
  await page.getByRole("button", { name: "English" }).click();
  await page.getByRole("button", { name: /My account/ }).click();

  const bouton = page.getByRole("button", { name: "Delete permanently" });
  await expect(bouton).toBeDisabled();
  await page.getByRole("textbox").fill("DELETE");
  await expect(bouton).toBeEnabled();
});
