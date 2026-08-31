import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

/**
 * CE QUE CE TEST TIENT — l'USAGE du garde sur un ÉCRAN RÉEL.
 *
 * Rejoindre une partie lit puis écrit dans RTDB. Hors ligne, le SDK ne rejette
 * pas : il met l'écriture en attente et la promesse ne se règle jamais. L'écran
 * resterait donc sur son `busy`, indéfiniment, sans un mot. Ce qu'on vérifie ici
 * n'est pas que `useActionGuard` fonctionne (le socle a ses tests) mais que
 * l'app s'en sert : bouton inerte, ET motif affiché.
 *
 * `aria-disabled` et non `disabled` : le bouton reste focusable, sinon
 * l'utilisateur au clavier ne peut plus DÉCOUVRIR pourquoi c'est bloqué.
 */

const joinSession = vi.fn();
const lookupSession = vi.fn();
vi.mock("../firebase/api", () => ({
  joinSession: (...a: unknown[]) => joinSession(...a),
  lookupSession: (...a: unknown[]) => lookupSession(...a),
}));

const { Join } = await import("./Join");

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", { configurable: true, value });
  act(() => {
    window.dispatchEvent(new Event(value ? "online" : "offline"));
  });
}

afterEach(() => {
  setNavigatorOnline(true);
  joinSession.mockReset();
  lookupSession.mockReset();
});

const PIN = "12345678"; // PIN_LENGTH = 8

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Code PIN/), PIN);
  await user.type(screen.getByLabelText("Ton pseudo"), "Zoé");
}

function renderJoin() {
  return render(
    <MemoryRouter>
      <Join />
    </MemoryRouter>,
  );
}

describe("rejoindre une partie hors connexion", () => {
  it("laisse le formulaire actif tant que le réseau est là", () => {
    renderJoin();
    expect(
      screen.getByRole("button", { name: "Entrer dans la partie" }),
    ).not.toHaveAttribute("aria-disabled");
    expect(screen.queryByText(/Indisponible hors ligne/)).toBeNull();
  });

  it("bloque l'envoi ET dit pourquoi", async () => {
    const user = userEvent.setup();
    renderJoin();
    // Formulaire VALIDE : ce qui bloque ensuite ne peut être que le réseau.
    await fillForm(user);
    const submit = screen.getByRole("button", {
      name: "Entrer dans la partie",
    });
    expect(submit).toBeEnabled();

    setNavigatorOnline(false);

    // Bloqué, mais toujours atteignable au clavier : pas de `disabled` natif,
    // sinon le bouton sort du parcours de focus et le motif devient
    // indécouvrable.
    expect(submit).toHaveAttribute("aria-disabled", "true");
    expect(submit).not.toBeDisabled();
    // Et le motif est à l'écran, pas seulement dans un attribut.
    expect(
      screen.getByText("Indisponible hors ligne — il faut du réseau pour ça."),
    ).toBeInTheDocument();

    await user.click(submit);
    // Ceinture ET bretelles : même cliqué, rien ne part vers Firebase.
    expect(lookupSession).not.toHaveBeenCalled();
    expect(joinSession).not.toHaveBeenCalled();
  });

  it("rend la main dès le retour du réseau", async () => {
    const user = userEvent.setup();
    lookupSession.mockResolvedValue({ teams: null });
    joinSession.mockResolvedValue({ sessionId: "s1" });
    renderJoin();

    setNavigatorOnline(false);
    setNavigatorOnline(true);

    await fillForm(user);
    await user.click(
      screen.getByRole("button", { name: "Entrer dans la partie" }),
    );
    expect(lookupSession).toHaveBeenCalledWith(PIN);
  });
});
