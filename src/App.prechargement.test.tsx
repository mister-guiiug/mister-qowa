import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';

/**
 * CE QUE CES TESTS VERROUILLENT : quels morceaux partent avant le clic, et
 * quand — pas la mécanique, qui vient de `react/use-prefetch` du socle et y
 * est testée.
 *
 * Les dix écrans sont doublés par des composants vides qui NOTENT leur
 * chargement : un morceau « demandé » est un module dont la fabrique a tourné.
 * Le registre de modules ne la joue qu'une fois par module, exactement comme
 * le navigateur ne télécharge un morceau qu'une fois — d'où `resetModules`
 * entre deux cas, pour repartir d'un cache vide.
 */
const { morceauxDemandes, doubleDEcran } = vi.hoisted(() => {
  const morceauxDemandes = new Set<string>();
  const doubleDEcran = (nom: string) => () => {
    morceauxDemandes.add(nom);
    return { [nom]: () => null };
  };
  return { morceauxDemandes, doubleDEcran };
});

vi.mock('./routes/Create', doubleDEcran('Create'));
vi.mock('./routes/Join', doubleDEcran('Join'));
vi.mock('./routes/Solo', doubleDEcran('Solo'));
vi.mock('./routes/History', doubleDEcran('History'));
vi.mock('./routes/Account', doubleDEcran('Account'));
vi.mock('./routes/Host', doubleDEcran('Host'));
vi.mock('./routes/Play', doubleDEcran('Play'));
vi.mock('./routes/QuizEditor', doubleDEcran('QuizEditor'));
vi.mock('./routes/AiGenerate', doubleDEcran('AiGenerate'));
vi.mock('./routes/TextImport', doubleDEcran('TextImport'));

const ECRANS_DE_L_ACCUEIL = ['Create', 'Join', 'Solo', 'History', 'Account'];

/** Le rappel confié à `requestIdleCallback`, à jouer quand ON le décide. */
let auRepos: IdleRequestCallback | null = null;

type NavigateurEconome = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
};

function avecConnexion(connection: NavigateurEconome['connection']) {
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: connection,
  });
}

async function monterLApp() {
  const { App } = await import('./App');
  render(<App />);
  // L'accueil est là avant tout préchargement : celui-ci ne lui prend rien.
  expect(
    await screen.findByRole('heading', { name: 'Mister Qowa' })
  ).toBeInTheDocument();
}

async function laisseLeNavigateurSouffler() {
  expect(auRepos).not.toBeNull();
  await act(async () => {
    auRepos?.({ didTimeout: false, timeRemaining: () => 50 });
  });
}

/** Le temps qu'un `import()` aurait mis à demander son module, s'il l'avait fait. */
const attendUnEventuelChargement = () =>
  new Promise(resolve => setTimeout(resolve, 100));

beforeEach(() => {
  vi.resetModules();
  morceauxDemandes.clear();
  auRepos = null;
  vi.stubGlobal(
    'requestIdleCallback',
    vi.fn((rappel: IdleRequestCallback) => {
      auRepos = rappel;
      return 1;
    })
  );
  vi.stubGlobal('cancelIdleCallback', vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  delete (navigator as NavigateurEconome).connection;
});

describe("le préchargement des écrans de l'accueil", () => {
  it("demande les cinq écrans de l'accueil au repos du navigateur, et eux seuls", async () => {
    await monterLApp();

    // Rien avant le repos : l'accueil garde le réseau pour lui.
    expect(morceauxDemandes.size).toBe(0);
    // Au repos, ou au plus tard trois secondes après le montage.
    expect(requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), {
      timeout: 3000,
    });

    await laisseLeNavigateurSouffler();

    await vi.waitFor(() => {
      expect([...morceauxDemandes].sort()).toEqual(
        [...ECRANS_DE_L_ACCUEIL].sort()
      );
    });
    // Ceux qu'on n'atteint qu'une partie ou un quiz engagé restent dehors.
    for (const ecran of [
      'Host',
      'Play',
      'QuizEditor',
      'AiGenerate',
      'TextImport',
    ])
      expect(morceauxDemandes.has(ecran)).toBe(false);
  });

  it.each([
    { cas: 'a demandé d’épargner son forfait', connection: { saveData: true } },
    { cas: 'est en 2G', connection: { effectiveType: '2g' } },
    { cas: 'est en 2G lente', connection: { effectiveType: 'slow-2g' } },
  ])('ne télécharge rien quand le visiteur $cas', async ({ connection }) => {
    avecConnexion(connection);
    await monterLApp();

    await laisseLeNavigateurSouffler();
    await attendUnEventuelChargement();

    expect(morceauxDemandes.size).toBe(0);
  });
});
