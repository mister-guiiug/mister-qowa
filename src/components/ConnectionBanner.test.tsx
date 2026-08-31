import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ConnectionBanner } from "./ConnectionBanner";
import { useConnectivity } from "../store/connectivityStore";

/**
 * CE QUE CES TESTS TIENNENT — l'USAGE, pas le composant du socle.
 *
 * 1. La temporisation existe VRAIMENT dans l'app : le bandeau ne clignote pas
 *    sur une micro-coupure. Un test qui vérifierait seulement « il finit par
 *    apparaître » laisserait passer un `delayMs` accidentellement ramené à 0.
 * 2. Le texte est celui de l'app (5 langues), pas le défaut français du socle.
 * 3. Le socle regarde `navigator.onLine`, mais l'app lui injecte un signal plus
 *    fin : le socket RTDB. Un réseau « présent » et un socket coupé (portail
 *    captif, Firebase injoignable) doivent afficher le bandeau — c'est ce que la
 *    version d'origine faisait, et c'est ce qu'on ne veut pas perdre.
 */

/** Bascule `navigator.onLine` et émet l'évènement que `useOnline` écoute. */
function setNavigatorOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value,
  });
  act(() => {
    window.dispatchEvent(new Event(value ? "online" : "offline"));
  });
}

afterEach(() => {
  vi.useRealTimers();
  setNavigatorOnline(true);
  act(() => useConnectivity.getState().setRtdb(null));
});

describe("bandeau hors connexion", () => {
  it("reste muet en ligne", () => {
    render(<ConnectionBanner />);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("attend la temporisation avant de s'afficher, puis dit quoi", () => {
    vi.useFakeTimers();
    render(<ConnectionBanner />);

    setNavigatorOnline(false);
    // Juste avant l'échéance : toujours rien. C'est la micro-coupure qui ne
    // doit pas faire clignoter l'écran.
    act(() => void vi.advanceTimersByTime(1499));
    expect(screen.queryByRole("status")).toBeNull();

    act(() => void vi.advanceTimersByTime(1));
    const banner = screen.getByRole("status");
    expect(banner).toHaveAttribute("data-dwc", "connection-banner");
    expect(banner).toHaveTextContent("Hors ligne — reconnexion…");
  });

  it("disparaît dès le retour du réseau, sans attendre", () => {
    vi.useFakeTimers();
    render(<ConnectionBanner />);

    setNavigatorOnline(false);
    act(() => void vi.advanceTimersByTime(1500));
    expect(screen.getByRole("status")).toBeInTheDocument();

    setNavigatorOnline(true);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("s'affiche quand le socket RTDB tombe, réseau OS présent", () => {
    vi.useFakeTimers();
    render(<ConnectionBanner />);

    // `navigator.onLine` reste à `true` : seul le socket temps réel a lâché.
    act(() => useConnectivity.getState().setRtdb(false));
    act(() => void vi.advanceTimersByTime(1500));
    expect(screen.getByRole("status")).toBeInTheDocument();

    // Socket non observé (personne sur Host/Play) : on ne prétend rien.
    act(() => useConnectivity.getState().setRtdb(null));
    expect(screen.queryByRole("status")).toBeNull();
  });
});
