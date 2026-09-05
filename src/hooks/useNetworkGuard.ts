/**
 * « Est-ce que ce bouton peut aboutir, et sinon QUE DIRE ? »
 *
 * Mister Qowa est un quiz TEMPS RÉEL : une partie en direct sans réseau n'a pas
 * de sens. Le garde est donc franc — il bloque AVANT le clic plutôt que de
 * laisser l'utilisateur découvrir l'échec.
 *
 * PARTICULARITÉ RTDB, ET C'EST ELLE QUI JUSTIFIE LE GARDE. Le SDK Realtime
 * Database met les écritures en attente locale quand le socket est coupé : la
 * promesse de `set()`/`update()` NE REJETTE PAS, elle ne se règle simplement
 * jamais. Un `useAsyncAction` reste donc `busy` indéfiniment — un spinner qui
 * tourne pour toujours, l'échec le plus muet qui soit. Le garde évite d'entrer
 * dans cette file ; on ne rejoue rien, on refuse d'écrire.
 */
import { useMemo } from "react";
import { useActionGuard } from "@mister-guiiug/dev-pwa-config/react/use-action-guard";
import { useOnline } from "@mister-guiiug/dev-pwa-config/react/use-online";
import { useConnectivity } from "../store/connectivityStore";
import { useT } from "../i18n";

/**
 * Connectivité de l'app : l'OS ET, quand quelqu'un l'observe, le socket RTDB.
 *
 * `navigator.onLine` ment par excès (portail captif, wifi sans internet) ;
 * `.info/connected` est la vérité du jeu en direct. On garde les deux : le
 * premier est disponible partout et tout de suite, le second affine dès qu'un
 * écran temps réel est monté.
 */
export function useAppOnline(): boolean {
  const navigatorOnline = useOnline();
  const rtdb = useConnectivity((s) => s.rtdb);
  return navigatorOnline && (rtdb ?? true);
}

type Guard = ReturnType<typeof useActionGuard>;

/**
 * Garde « il faut du réseau », avec le motif traduit dans les 5 langues.
 *
 * Le socle résout `reason` depuis ses propres libellés, qui ne connaissent que
 * `fr` et `en` ; l'app en parle cinq. On lui laisse donc la DÉCISION (`allowed`,
 * `disabledProps`, `wrap`) et on garde le TEXTE. C'est aussi ce qui évite un
 * message figé au changement de langue : `useActionGuard` mémoïse sur le
 * contenu de `checks` (code + blocked), pas sur les messages.
 */
export function useNetworkGuard(): Guard {
  const t = useT();
  const online = useAppOnline();
  const guard = useActionGuard({
    checks: useMemo(() => [{ code: "offline", blocked: !online }], [online]),
  });
  return {
    ...guard,
    reason: guard.reasonCode === "offline" ? t("guard.offline") : guard.reason,
  };
}
