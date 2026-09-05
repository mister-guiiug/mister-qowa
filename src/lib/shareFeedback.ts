import type { ShareResult } from "@mister-guiiug/dev-pwa-config/share";

/** Clés i18n que l'hôte peut afficher après un partage. */
export type ShareInfoKey = "host.linkCopied" | "host.shareUnavailable";

/**
 * Ce que l'app DIT selon l'issue d'un partage — la politique d'affichage, la
 * seule part que le socle ne peut pas décider à notre place.
 *
 * DEUX ISSUES SE TAISENT, et pour deux raisons opposées :
 *  - `shared` : la feuille native a fait son travail et l'a déjà montré ;
 *  - `cancelled` : l'utilisateur a renoncé. Ce n'est pas une panne, et le lui
 *    annoncer comme telle est le défaut que la copie locale de `shareOrCopy`
 *    portait. Elle renvoyait `'failed'` dès que `navigator.share` levait — or
 *    il lève AUSSI quand on ferme la feuille — et l'hôte affichait alors
 *    « Partage indisponible » à quelqu'un qui avait simplement changé d'avis.
 *
 * DEUX ISSUES PARLENT :
 *  - `copied` : le repli presse-papiers a marché, mais rien à l'écran ne le
 *    montrerait sans message ;
 *  - `failed` : ni le partage ni la copie n'ont abouti, il faut le dire.
 */
export function shareInfoKey(result: ShareResult): ShareInfoKey | null {
  if (result === "copied") return "host.linkCopied";
  if (result === "failed") return "host.shareUnavailable";
  return null;
}
