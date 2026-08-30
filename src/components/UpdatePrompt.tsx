import { registerSW } from "virtual:pwa-register";
import { UpdatePromptBanner } from "@mister-guiiug/dev-wpa-config/react/update-prompt-banner";
import type { RegisterSW } from "@mister-guiiug/dev-wpa-config/react/use-update-prompt";
import { useT } from "../i18n";

/**
 * `registerSW` + revérification horaire. Le bandeau du socle ne paramètre pas
 * l'intervalle de vérification : on le garde ici, autour de la fonction
 * injectée. Déclarée AU NIVEAU MODULE : le hook mémorise sa connexion par
 * identité de fonction (une fonction recréée à chaque rendu ré-enregistrerait
 * le service worker).
 */
const registerSWHourly: RegisterSW = (options) =>
  registerSW({
    ...options,
    onRegisteredSW(swUrl, registration) {
      options?.onRegisteredSW?.(swUrl, registration);
      // Vérifie une nouvelle version toutes les heures.
      if (registration) {
        setInterval(() => void registration.update(), 60 * 60 * 1000);
      }
    },
  });

/**
 * Bannière de mise à jour PWA. Le SW est en `prompt` (pas d'auto-reload pendant
 * une partie) : quand une nouvelle version est prête, on propose de recharger.
 * Voir aussi le bouton « Recharger » manuel du footer.
 *
 * La mécanique ET l'habillage viennent du socle (`react/update-prompt-banner`,
 * non stylé, habillé par `components.css` via les jetons `--dwc-*` de
 * `index.css`). Ne reste ici que ce que le socle ne sait pas :
 *   - `registerSW` INJECTÉ — sans lui `needRefresh` reste faux et le bandeau
 *     ne peut structurellement jamais s'afficher (éprouvé par le test voisin) ;
 *   - la revérification horaire, absente du socle ;
 *   - les libellés, traduits par l'i18n de l'app (5 langues, le socle n'en
 *     connaît que 2) ;
 *   - le placement flottant en bas d'écran, que le socle laisse à l'app.
 *
 * `snoozeHours` reste à 0 (défaut) : « Plus tard » écarte le bandeau pour la
 * session, exactement comme la bannière locale qu'elle remplace.
 */
export function UpdatePrompt() {
  const t = useT();
  return (
    <UpdatePromptBanner
      registerSW={registerSWHourly}
      title={t("update.available")}
      updateLabel={t("common.reload")}
      updatingLabel={t("update.updating")}
      dismissLabel={t("update.later")}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md"
    />
  );
}
