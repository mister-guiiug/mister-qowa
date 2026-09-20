import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Suspense, lazy, type ComponentType } from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Home } from './Home';
import { useLang } from '../i18n';

/**
 * LE DÉFAUT QUE CES TESTS VERROUILLENT : un clic sans aucun effet visible.
 *
 * Diagnostiqué sur miss-badminton le 20/09/2026 (PR #80), puis retrouvé sur
 * onze dépôts du parc. Chaque entrée de l'accueil mène à une route
 * `React.lazy` : sans transition à nous, le clic reste MUET tout le temps de
 * l'aller-retour réseau du morceau.
 *
 * Mesuré à froid sur deux sites publiés, première visite, service worker pas
 * encore installé : 133 ms d'écran figé sur mister-settle, 161 ms sur
 * mister-molkky, `aria-busy` faux d'un bout à l'autre.
 *
 * La cause n'est pas une lenteur anormale : react-router 7 enveloppe tout
 * changement d'URL dans `startTransition`, et React 19 garde alors
 * délibérément l'écran déjà affiché plutôt que de montrer le repli de
 * `Suspense`. Le repli d'`App` existait bien — il n'a simplement jamais pu
 * paraître sur un clic.
 *
 * Ces tests tiennent le CONTRAT, pas la mise en forme : tant que l'écran n'est
 * pas là, le bouton cliqué se dit occupé et l'accueil reste à l'écran.
 */

/** Monte l'accueil face à un écran dont on décide nous-même de l'arrivée. */
function monterFaceAUnEcranLent() {
  let resous!: () => void;
  const EcranLent = lazy(
    () =>
      new Promise<{ default: ComponentType }>(resolve => {
        resous = () => resolve({ default: () => <h1>Mes parties à moi</h1> });
      })
  );

  render(
    <MemoryRouter initialEntries={['/']}>
      <Suspense fallback={<p>repli de route</p>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<EcranLent />} />
        </Routes>
      </Suspense>
    </MemoryRouter>
  );

  return {
    bouton: (nom: RegExp) => screen.getByRole('button', { name: nom }),
    livreLEcran: async () => {
      await act(async () => {
        resous();
      });
    },
  };
}

beforeEach(() => {
  // L'accueil parle cinq langues ; on fixe le français pour lire les libellés.
  act(() => useLang.setState({ lang: 'fr' }));
});

afterEach(() => {
  cleanup();
});

describe("le clic sur une entrée de l'accueil répond avant que l'écran soit là", () => {
  it("dit le bouton occupé tant que le morceau n'est pas arrivé", async () => {
    const { bouton, livreLEcran } = monterFaceAUnEcranLent();

    fireEvent.click(bouton(/Mes parties/));

    expect(bouton(/Mes parties/)).toHaveAttribute('aria-busy', 'true');
    // Les autres entrées ne se disent pas occupées : c'est celle qu'on a
    // cliquée qui travaille, pas l'écran entier.
    expect(bouton(/Mon compte/)).not.toHaveAttribute('aria-busy');

    await livreLEcran();

    expect(
      screen.getByRole('heading', { name: 'Mes parties à moi' })
    ).toBeInTheDocument();
  });

  it('annonce le chargement dans une zone vive, hors des boutons', () => {
    const { bouton } = monterFaceAUnEcranLent();

    expect(screen.getByRole('status')).toHaveTextContent('');
    fireEvent.click(bouton(/Mes parties/));

    // HORS des boutons : le nom accessible de « Mes parties » ne doit pas
    // changer en cours de route sous le doigt d'un lecteur d'écran.
    expect(screen.getByRole('status')).toHaveTextContent('Chargement…');
    expect(bouton(/Mes parties/)).toHaveAccessibleName('Mes parties');
  });

  it("garde l'accueil à l'écran pendant l'attente", () => {
    const { bouton } = monterFaceAUnEcranLent();

    fireEvent.click(bouton(/Mes parties/));

    // CE QUE LE REPLI DE `Suspense` NE FERA PAS. React 19 garde l'écran déjà
    // affiché pendant la transition : l'accueil est toujours là, et le repli de
    // route n'a pas paru. C'est exactement pourquoi l'accueil doit parler —
    // lui seul le peut.
    expect(
      screen.getByRole('heading', { name: 'Mister Qowa' })
    ).toBeInTheDocument();
    expect(screen.queryByText('repli de route')).toBeNull();
    expect(bouton(/Mes parties/)).toHaveAttribute('aria-busy', 'true');
  });
});
