import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

/**
 * LA CAPACITÉ QUI N'EST PAS DANS LE SOCLE. `UpdatePromptBanner` sait afficher
 * un bandeau quand vite-plugin-pwa annonce un worker en attente, mais il ne
 * DEMANDE jamais au navigateur d'aller voir s'il en existe un : une page
 * laissée ouverte toute une soirée de quiz ne découvrirait la mise à jour
 * qu'au rechargement suivant. `registerSWHourly` garde cette revérification
 * horaire autour de la fonction injectée. Ce test la tient.
 *
 * Fichier séparé à dessein : le hook du socle mémorise sa connexion dans une
 * `WeakMap` de module, par identité de `registerSW`. Un second fichier = un
 * graphe de modules neuf, donc un enregistrement neuf à observer.
 */

type Registered = (
  swUrl: string,
  registration?: ServiceWorkerRegistration,
) => void;

const registration = { update: vi.fn() };

// Le double appelle `onRegisteredSW` comme le fait vite-plugin-pwa une fois le
// service worker enregistré — c'est ce rappel qui arme l'intervalle.
vi.mock("virtual:pwa-register", () => ({
  registerSW: (options?: { onRegisteredSW?: Registered }) => {
    options?.onRegisteredSW?.(
      "/sw.js",
      registration as unknown as ServiceWorkerRegistration,
    );
    return vi.fn();
  },
}));

const { UpdatePrompt } = await import("./UpdatePrompt");

const HOUR = 60 * 60 * 1000;

describe("revérification horaire", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("demande une vérification au navigateur toutes les heures", () => {
    render(<UpdatePrompt />);
    expect(registration.update).not.toHaveBeenCalled();

    vi.advanceTimersByTime(HOUR);
    expect(registration.update).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(HOUR);
    expect(registration.update).toHaveBeenCalledTimes(2);
  });
});
