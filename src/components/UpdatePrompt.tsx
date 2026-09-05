import { registerSW } from "virtual:pwa-register";
import { AppUpdates } from "@mister-guiiug/dev-pwa-config/react/app-updates";
import { useT } from "../i18n";

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
 * Ne reste ici que ce que le socle ne sait pas : les libellés traduits par
 * l'i18n de l'app (5 langues, le socle n'en connaît que 2) et le placement
 * flottant en bas d'écran, que le socle laisse à l'app.
 *
 * `snoozeHours` reste à 0 (défaut) : « Plus tard » écarte le bandeau pour la
 * session, exactement comme la bannière locale qu'elle remplace.
 */
export function UpdatePrompt() {
  const t = useT();
  return (
    <AppUpdates
      registerSW={registerSW}
      checkEvery="1h"
      bannerProps={{
        title: t("update.available"),
        updateLabel: t("common.reload"),
        updatingLabel: t("update.updating"),
        dismissLabel: t("update.later"),
        className: "fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md",
      }}
    />
  );
}
