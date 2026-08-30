import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * CE QUE CE TEST TIENT. Le bandeau du socle ne s'affiche QUE si on lui injecte
 * `registerSW` : sans injection, personne n'annonce au hook qu'un worker
 * attend, `needRefresh` reste faux et le bandeau ne peut structurellement
 * jamais apparaître. Monté, mais muet — un défaut que rien ne signale (pas
 * d'erreur, pas d'avertissement, le composant est bien dans l'arbre React), et
 * qu'une app voisine a livré sans que personne le voie. Seul un utilisateur
 * pouvait s'en apercevoir, en ne voyant jamais la mise à jour arriver.
 *
 * C'est donc le composant RÉEL de l'app qui est monté ici, avec sa vraie
 * fonction `registerSWHourly` : ce qu'on éprouve est le CÂBLAGE, pas le
 * composant du paquet.
 */

// `virtual:pwa-register` n'existe que dans un build Vite. Ce double annonce un
// worker en attente dès l'enregistrement, comme le fait vite-plugin-pwa.
const registerSW = vi.fn((options?: { onNeedRefresh?: () => void }) => {
  options?.onNeedRefresh?.();
  return vi.fn();
});
vi.mock("virtual:pwa-register", () => ({
  registerSW: (options?: { onNeedRefresh?: () => void }) => registerSW(options),
}));

const { UpdatePrompt } = await import("./UpdatePrompt");

describe("bannière de mise à jour", () => {
  it("apparaît quand un service worker attend", () => {
    render(<UpdatePrompt />);

    // L'injection a bien eu lieu : sans cet appel, rien ne peut s'afficher.
    expect(registerSW).toHaveBeenCalled();

    const banner = screen.getByRole("status");
    expect(banner).toHaveAttribute("data-dwc", "update-banner");
    // Le titre est celui de l'app (i18n maison), pas le défaut du socle.
    expect(banner).toHaveTextContent("Nouvelle version disponible");
    // Et il offre une sortie : un bandeau sans échappatoire est un piège.
    expect(
      screen.getByRole("button", { name: "Recharger" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Plus tard" }),
    ).toBeInTheDocument();
  });

  it("« Plus tard » l'écarte", async () => {
    render(<UpdatePrompt />);
    expect(screen.getByRole("status")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Plus tard" }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
