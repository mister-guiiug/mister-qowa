import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, TriangleAlert } from "lucide-react";
import { ConfirmDialog } from "@mister-guiiug/dev-pwa-config/react/confirm-dialog";
import { createLogger } from "@mister-guiiug/dev-pwa-config/logger";
import { Screen, Card, Button } from "../lib/ui";
import { deleteMyAccount, outcomeMessageKey } from "../lib/account";
import { useT, type Key } from "../i18n";

const log = createLogger("account");

/**
 * « Mon compte » : voir son identifiant, se déconnecter, tout supprimer.
 *
 * POURQUOI CET ÉCRAN EXISTE. L'application n'offrait NI déconnexion NI
 * suppression : un compte invité se créait tout seul à la première partie, et
 * rien, nulle part, ne permettait de s'en défaire. Les parties hébergées —
 * pseudos et scores des joueurs compris — restaient chez Firebase sans fin.
 *
 * L'ORDRE DES DEUX CARTES EST DÉLIBÉRÉ. La déconnexion vient d'abord parce
 * qu'elle est le geste réversible… sauf ici : sur un compte anonyme, se
 * déconnecter n'efface rien mais rend tout INJOIGNABLE. La carte le dit, et
 * renvoie vers la suppression pour qui veut vraiment effacer. Sans cette
 * phrase, « Se déconnecter » ressemblerait à une sortie de secours alors que
 * c'est un aller simple.
 *
 * LE GESTE DÉLIBÉRÉ. Le bouton de suppression ne s'active qu'une fois le mot
 * de confirmation saisi — traduit, donc « SUPPRIMER » en français, « DELETE »
 * en anglais. Un clic ne suffit pas, et un clic MAL PLACÉ encore moins : c'est
 * la seule action de l'app qu'aucun écran ne peut rattraper.
 */
export function Account() {
  const t = useT();
  const nav = useNavigate();
  const [uid, setUid] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [askSignOut, setAskSignOut] = useState(false);
  const [notice, setNotice] = useState<Key | null>(null);
  const [error, setError] = useState<Key | null>(null);

  // Lecture SANS création : voir `peekAuthUid`. Un écran qui regarde un compte
  // ne doit pas en ouvrir un.
  useEffect(() => {
    let alive = true;
    void import("../firebase/app")
      .then((m) => m.peekAuthUid())
      .then((found) => {
        if (alive) setUid(found);
      })
      .catch((e) => {
        log.error("[account] lecture de la session impossible", { error: e });
      });
    return () => {
      alive = false;
    };
  }, []);

  const word = t("account.confirmWord");
  const armed = typed.trim().toUpperCase() === word.toUpperCase();

  async function doSignOut() {
    setAskSignOut(false);
    setBusy(true);
    setError(null);
    try {
      const { signOutCurrentUser } = await import("../firebase/app");
      await signOutCurrentUser();
      setUid(null);
      setNotice("account.signOutDone");
    } catch (e) {
      log.error("[account] déconnexion échouée", { error: e });
      setError("err.signOutFailed");
    } finally {
      setBusy(false);
    }
  }

  async function doDelete() {
    setBusy(true);
    setError(null);
    try {
      const report = await deleteMyAccount();
      setUid(report.outcome === "deleted" ? null : uid);
      setTyped("");
      setNotice(outcomeMessageKey(report.outcome));
    } catch (e) {
      // Le message brut de Firebase (« Missing or insufficient permissions »)
      // ne dit rien à qui vient de cliquer : on journalise le vrai, on affiche
      // une phrase — et on pointe le canal de signalement du pied de page.
      log.error("[account] suppression échouée", { error: e });
      setError("err.accountDeleteFailed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <button
        type="button"
        onClick={() => nav("/")}
        className="mb-4 inline-flex items-center gap-1 self-start text-sm text-white/60 hover:text-white"
      >
        <ArrowLeft className="size-4" /> {t("common.home")}
      </button>
      <h1 className="font-display text-3xl">{t("account.title")}</h1>

      {notice ? (
        <p
          role="status"
          className="mt-4 rounded-xl bg-emerald-500/20 px-4 py-3 text-sm text-emerald-100"
        >
          {t(notice)}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-rose-500/20 px-4 py-3 text-sm text-rose-200"
        >
          {t(error)}
        </p>
      ) : null}

      <Card className="mt-6">
        <h2 className="font-display text-xl">{t("account.guestTitle")}</h2>
        <p className="mt-2 text-sm text-white/60">{t("account.guestBody")}</p>
        <p className="mt-3 text-sm text-white/50">
          {uid ? (
            <>
              {t("account.uidLabel")} :{" "}
              <span className="break-all font-mono text-white/70">{uid}</span>
            </>
          ) : (
            t("account.uidPending")
          )}
        </p>
      </Card>

      <Card className="mt-4">
        <h2 className="font-display text-xl">{t("account.signOutTitle")}</h2>
        <p className="mt-2 text-sm text-white/60">{t("account.signOutBody")}</p>
        <Button
          variant="ghost"
          className="mt-4"
          disabled={busy || !uid}
          onClick={() => setAskSignOut(true)}
        >
          <LogOut className="size-4" /> {t("account.signOut")}
        </Button>
      </Card>

      {/* Zone dangereuse : cadre rouge, titre explicite, et la liste de ce qui
          part — pas « toutes vos données », qui ne dit rien de vérifiable. */}
      <section className="mt-8 rounded-3xl bg-rose-500/10 p-5 ring-1 ring-rose-400/40">
        <h2 className="inline-flex items-center gap-2 font-display text-xl text-rose-200">
          <TriangleAlert className="size-5" /> {t("account.dangerTitle")}
        </h2>
        <h3 className="mt-3 font-semibold">{t("account.deleteTitle")}</h3>
        <p className="mt-2 text-sm text-white/70">{t("account.deleteBody")}</p>
        <ul className="mt-2 list-disc pl-5 text-sm text-white/60">
          <li>{t("account.deleteItemResults")}</li>
          <li>{t("account.deleteItemQuizzes")}</li>
          <li>{t("account.deleteItemLocal")}</li>
          <li>{t("account.deleteItemAccount")}</li>
        </ul>
        {/* Et ce qui NE part pas. Une suppression de compte qui ne dit que ce
            qu'elle emporte se lit comme une promesse d'effacement total ; la
            partie d'un AUTRE organisateur n'est pas à nous, et son classement
            appartient aussi aux autres joueurs. Le dire ici plutôt que dans le
            message de fin : on le lit AVANT de décider. */}
        <p className="mt-3 text-sm text-white/50">{t("account.deleteLimit")}</p>

        <label className="mt-4 flex flex-col gap-2 text-sm text-white/70">
          {t("account.typeToConfirm", { word })}
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="rounded-2xl bg-white/10 px-4 py-3 font-mono uppercase tracking-widest outline-none ring-1 ring-white/15 focus:ring-rose-400"
          />
        </label>

        <Button
          variant="danger"
          full
          className="mt-4"
          disabled={!armed || busy}
          onClick={() => void doDelete()}
        >
          {busy ? t("account.deleting") : t("account.delete")}
        </Button>
      </section>

      {askSignOut ? (
        <ConfirmDialog
          open
          title={t("account.signOutTitle")}
          message={t("account.signOutConfirm")}
          confirmLabel={t("account.signOut")}
          cancelLabel={t("common.cancel")}
          destructive
          onConfirm={() => void doSignOut()}
          onCancel={() => setAskSignOut(false)}
        />
      ) : null}
    </Screen>
  );
}
