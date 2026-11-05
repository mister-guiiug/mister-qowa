import { test, expect } from '@playwright/test';

/*
 * LA BUILD DE PRODUCTION, RECHARGÉE HORS LIGNE.
 *
 * Constaté le 05/11/2026 sur https://mister-guiiug.github.io/mister-qowa/ :
 * coupé du réseau, le site ne démarrait plus. Rolldown avait rangé React dans
 * `assets/sentry.js`, le morceau que le service worker tient VOLONTAIREMENT
 * hors du précache ; l'entrée commençait par `import{n}from"./sentry.js"`, et
 * sans ce fichier React ne montait pas. Aucun test ne pouvait le voir : les
 * autres specs tournent sur le serveur de DÉVELOPPEMENT, sans service worker
 * ni découpage de production.
 *
 * Celle-ci vise la build servie par `vite preview` (second serveur de
 * `playwright.config.ts`, sous la base de production) et rejoue le geste de
 * l'utilisateur : une visite en ligne installe le worker, un rechargement le
 * fait contrôler la page, puis la coupure, puis un rechargement.
 *
 * LA COUPURE EST DOUBLE. `setOffline` seul laisse passer les requêtes du
 * service worker ; `context.route` refuse tout, y compris les siennes.
 *
 * LE TÉMOIN EST CE QUE SEUL REACT REND. Le titre « Mister Qowa » peut venir du
 * contenu statique servi aux robots ; le bouton « Héberger un quiz », non.
 */
const BUILD = 'http://localhost:4173/mister-qowa/';

test.describe('@critical hors ligne', () => {
  test('la build de production se recharge sans réseau', async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(
      browserName !== 'chromium',
      'Seul Chromium route les requêtes du service worker.'
    );
    test.slow();

    await page.goto(BUILD);
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
      .toBe(true);

    await context.setOffline(true);
    await context.route('**/*', route => route.abort('internetdisconnected'));
    await page.reload();

    await expect(
      page.getByRole('button', { name: /Héberger un quiz/ })
    ).toBeVisible();
  });
});
