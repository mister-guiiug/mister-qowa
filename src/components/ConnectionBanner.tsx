import { WifiOff } from "lucide-react";
import { ConnectionBanner as SocleConnectionBanner } from "@mister-guiiug/dev-wpa-config/react/connection-banner";
import { useAppOnline } from "../hooks/useNetworkGuard";
import { useT } from "../i18n";

/**
 * Bandeau « Hors ligne — reconnexion… ».
 *
 * LE SOCLE EST PROMU D'ICI, ON LUI REND LA MAIN. `react/connection-banner`
 * (3.24.0) est la copie de ce fichier : même temporisation de 1,5 s hors ligne
 * CONTINU, même remise à zéro pendant le rendu, même `role="status"`. Ne reste
 * ici que ce que le socle ne peut pas savoir : le texte dans les 5 langues de
 * l'app, l'icône, le placement, et la SOURCE de connectivité.
 *
 * La source, justement, est la seule chose que l'app fait de plus : le socle lit
 * `navigator.onLine`, qui ment par excès (portail captif). `useAppOnline`
 * combine `navigator.onLine` ET le socket RTDB observé par les écrans temps
 * réel — c'est le `online` que le socle prévoit explicitement en prop.
 *
 * MONTÉ UNE SEULE FOIS, dans `App.tsx`. Il était auparavant posé dans `Host` et
 * `Play`, donc absent de l'accueil, de la création et du salon de connexion — là
 * où l'on décide de lancer une partie.
 */
export function ConnectionBanner() {
  const t = useT();
  const online = useAppOnline();
  return (
    <SocleConnectionBanner
      online={online}
      // DANS LE FLUX, pas en surimpression. Un `fixed top-3` recouvrait le lien
      // « ← Accueil » de chaque écran — on aurait échangé un échec muet contre
      // une sortie masquée. `sticky` le garde visible au défilement sans rien
      // cacher ; il reste EN HAUT, alors que les deux autres invites (mise à
      // jour, installation) sont ancrées en bas : jamais d'empilement.
      className="sticky top-0 z-50 mx-auto mt-2 flex w-[calc(100%-1.5rem)] max-w-md items-center justify-center gap-2"
      label={
        <>
          <WifiOff className="size-4" aria-hidden />
          {t("connection.offline")}
        </>
      }
    />
  );
}
