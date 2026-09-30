import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import {
  isAnalyticsLoaded,
  resetAnalytics,
} from '@mister-guiiug/dev-pwa-config/analytics';
import {
  readConsentChoice,
  writeConsentChoice,
} from '@mister-guiiug/dev-pwa-config/react/consent-banner';
import { CLE_DE_TEST } from '@mister-guiiug/dev-pwa-config/testing/posthog';
import { Account } from './Account';
import { useLang } from '../i18n';
import { en } from '../i18n/en';
import { fr } from '../i18n/fr';

/**
 * RETIRER SON CONSENTEMENT DOIT ÊTRE AUSSI SIMPLE QUE LE DONNER (RGPD, art.
 * 7.3). Au relevé du 29/09/2026, une fois le bandeau répondu, plus rien dans
 * l'app ne permettait de revenir sur son choix. Faute d'écran Réglages, le
 * chemin du retour passe par « Mon compte » : ces tests le tiennent jusqu'à la
 * bibliothèque de mesure.
 */

// L'accord rejoué au montage charge la bibliothèque : la vraie partirait
// interroger PostHog depuis jsdom. Le double du socle se souvient du retrait.
vi.mock('posthog-js/dist/module.slim.js', async () => {
  const { fauxPosthog } =
    await import('@mister-guiiug/dev-pwa-config/testing/posthog');
  return { default: fauxPosthog() };
});

// L'écran lit la session au montage : le vrai module ouvrirait une
// application Firebase dans jsdom.
vi.mock('../firebase/app', () => ({
  peekAuthUid: () => Promise.resolve('uid-de-test'),
  signOutCurrentUser: vi.fn(),
}));

function monter() {
  render(
    <MemoryRouter initialEntries={['/account']}>
      <Account />
    </MemoryRouter>
  );
}

beforeEach(() => {
  // Un choix laissé par un test serait relu par le suivant.
  localStorage.clear();
  // L'écran parle cinq langues ; on fixe le français pour lire les libellés.
  act(() => useLang.setState({ lang: 'fr', dict: fr }));
  vi.stubEnv('VITE_POSTHOG_KEY', CLE_DE_TEST);
  // L'état de la mesure est celui d'un module : sans remise à zéro, la
  // bibliothèque resterait « chargée » d'un test à l'autre.
  resetAnalytics();
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('Mon compte — mesure d’audience', () => {
  it('l’écran permet de retirer son consentement, en un clic', async () => {
    writeConsentChoice('granted');
    monter();

    const titre = await screen.findByRole('heading', {
      name: 'Mesure d’audience',
    });
    const section = titre.closest('section') as HTMLElement;
    expect(within(section).getByRole('status')).toHaveTextContent(
      'Vous avez accepté cette mesure.'
    );
    // L'accord rejoué au montage a chargé la bibliothèque — le double.
    await waitFor(() => expect(isAnalyticsLoaded()).toBe(true));
    const posthog = (await import('posthog-js/dist/module.slim.js')).default;
    expect(posthog.has_opted_out_capturing()).toBe(false);

    fireEvent.click(
      within(section).getByRole('button', {
        name: 'Retirer mon consentement',
      })
    );

    expect(readConsentChoice()).toBe('denied');
    // Le clic est PARVENU à la bibliothèque, pas seulement au libellé.
    expect(posthog.has_opted_out_capturing()).toBe(true);
    expect(within(section).getByRole('status')).toHaveTextContent(
      'Vous avez refusé cette mesure.'
    );
  });

  it('parle la langue de l’app, que le socle ne reçoit pas de la coquille', async () => {
    act(() => useLang.setState({ lang: 'en', dict: en }));
    writeConsentChoice('granted');
    monter();

    const titre = await screen.findByRole('heading', {
      name: 'Audience measurement',
    });
    const section = titre.closest('section') as HTMLElement;
    expect(within(section).getByRole('status')).toHaveTextContent(
      'You have accepted this measurement.'
    );
    expect(
      within(section).getByRole('button', { name: 'Withdraw my consent' })
    ).toBeInTheDocument();
  });
});

describe('le bandeau — dans la langue de l’app', () => {
  it('pose la question en anglais à qui a choisi l’anglais', async () => {
    act(() => useLang.setState({ lang: 'en', dict: en }));
    const { App } = await import('../App');
    render(<App />);

    // Sans choix mémorisé, le bandeau pose la question — la coquille lui
    // relaie désormais la langue, comme à la section de « Mon compte ».
    const bandeau = await screen.findByRole('region', {
      name: 'Audience measurement',
    });
    expect(
      within(bandeau).getByRole('button', { name: 'Accept' })
    ).toBeInTheDocument();
  });
});
