import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

/**
 * LA CAPACITÉ, ET SEULEMENT ELLE. `UpdatePromptBanner` sait afficher un bandeau
 * quand vite-plugin-pwa annonce un worker en attente, mais il ne DEMANDE jamais
 * au navigateur d'aller voir s'il en existe un : une page laissée ouverte toute
 * une soirée de quiz ne découvrirait la mise à jour qu'au rechargement suivant.
 *
 * CE QUI A CHANGÉ. Cette revérification était portée par un `registerSWHourly`
 * local. Elle est en réalité DANS le socle, sous la prop `checkEvery` — promue
 * depuis cette app, qui était la seule à la faire. Ce test ne vérifie donc plus
 * notre plomberie mais l'USAGE : au bout d'une heure, l'app demande bien au
 * navigateur d'aller regarder.
 *
 * Le mécanisme a changé avec le propriétaire : le socle passe par
 * `navigator.serviceWorker.getRegistration()` plutôt que par la registration
 * remise par `onRegisteredSW`. D'où le double ci-dessous. C'est plus robuste —
 * l'intervalle est clairé au démontage, et un `update()` qui échoue est avalé.
 *
 * Fichier séparé à dessein : le hook du socle mémorise sa connexion dans une
 * `WeakMap` de module, par identité de `registerSW`. Un second fichier = un
 * graphe de modules neuf, donc un enregistrement neuf à observer.
 */

vi.mock("virtual:pwa-register", () => ({
  registerSW: () => vi.fn(),
}));

const update = vi.fn().mockResolvedValue(undefined);
const getRegistration = vi.fn().mockResolvedValue({ update });

const { UpdatePrompt } = await import("./UpdatePrompt");

const HOUR = 60 * 60 * 1000;

describe("revérification horaire", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    update.mockClear();
    getRegistration.mockClear();
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { getRegistration },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Reflect.deleteProperty(navigator, "serviceWorker");
  });

  it("demande une vérification au navigateur toutes les heures", async () => {
    render(<UpdatePrompt />);
    expect(update).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(HOUR);
    expect(update).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(HOUR);
    expect(update).toHaveBeenCalledTimes(2);
  });

  it("cesse de demander une fois l'app démontée", async () => {
    const { unmount } = render(<UpdatePrompt />);
    await vi.advanceTimersByTimeAsync(HOUR);
    expect(update).toHaveBeenCalledTimes(1);

    // L'intervalle local n'était JAMAIS clairé : il survivait au démontage.
    unmount();
    await vi.advanceTimersByTimeAsync(3 * HOUR);
    expect(update).toHaveBeenCalledTimes(1);
  });
});
