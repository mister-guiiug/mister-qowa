import { registerSW } from 'virtual:pwa-register';
import { AppUpdates } from '@mister-guiiug/dev-pwa-config/react/app-updates';
import { LabelsProvider } from '@mister-guiiug/dev-pwa-config/react/labels';
import { useLang } from '../i18n';

/**
 * Bannière de mise à jour PWA. Le SW est en `prompt` (pas d'auto-reload pendant
 * une partie) : quand une nouvelle version est prête, on propose de recharger.
 * Voir aussi le bouton « Recharger » manuel du footer.
 *
 * L'ENREGISTREMENT ET LA REVÉRIFICATION VIENNENT DU SOCLE. L'app gardait un
 * `registerSWHourly` local qui enveloppait `registerSW` pour armer un
 * `setInterval` d'une heure sur `registration.update()`. C'était un doublon :
 * `AppUpdates` publie `checkEvery`, et cette prop a été PROMUE depuis cette
 * app — mister-qowa était la seule à faire cette revérification. Elle gardait
 * donc une copie de ce qu'elle avait elle-même donné au socle. La migration
 * précédente n'avait déplacé que le bandeau, pas l'enregistrement.
 *
 * `checkEvery="1h"` est lu par `parseInterval`, qui accepte `'1h'`, `'30m'`,
 * `'45s'` ou un nombre de millisecondes ; `'1h'` vaut exactement les
 * `60 * 60 * 1000` d'avant. Deux gains au passage : l'intervalle est CLAIRÉ au
 * démontage (le nôtre ne l'était jamais) et un `update()` qui échoue est
 * avalé au lieu de partir en rejet non traité.
 *
 * `registerSW` N'EST DONNÉ QU'UNE FOIS, au fournisseur : il le passe au hook
 * ET au bandeau, et `useUpdatePrompt` mémorise sa connexion par IDENTITÉ de la
 * fonction (WeakMap). Deux points d'appel avec la même fonction ne produisent
 * donc qu'un seul enregistrement — d'où l'import direct de `virtual:pwa-register`,
 * stable au niveau module.
 *
 * LES LIBELLÉS VENAIENT DE L'APP, ET LA RAISON A DISPARU. Elle était écrite
 * ici : « 5 langues, le socle n'en connaît que 2 ». C'était vrai ; le socle en
 * livre SEPT, les cinq de Qowa comprises. La surcharge ne protégeait donc plus
 * de rien — elle ajoutait une neuvième façon d'annoncer une mise à jour dans
 * un parc qui en comptait déjà huit.
 *
 * `LabelsProvider` EST NÉCESSAIRE, et c'est ce qui rend le retrait sûr : sans
 * lui, le socle sert le FRANÇAIS à tout le monde, en silence. L'app n'en
 * montait un que dans `FamilyLinks` ; il est ici au plus près du bandeau,
 * plutôt qu'à la racine, pour ne rien changer d'autre à l'écran.
 *
 * Ne reste donc ici que le placement flottant en bas d'écran, que le socle
 * laisse à l'app.
 *
 * `snoozeHours` est à 0, et ÉCRIT : « Plus tard » écarte le bandeau pour la
 * session, exactement comme la bannière locale qu'elle remplace.
 */
export function UpdatePrompt() {
  const lang = useLang(s => s.lang);
  return (
    <LabelsProvider locale={lang}>
      <AppUpdates
        snoozeHours={0}
        registerSW={registerSW}
        checkEvery="1h"
        bannerProps={{
          className: 'fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md',
        }}
      />
    </LabelsProvider>
  );
}
