import { useEffect, useRef } from "react";
import { Button } from "../lib/ui";
import { useT } from "../i18n";

/**
 * Confirmation in-app (charte sombre, testable, accessible) en remplacement de
 * window.confirm. Échap annule ; le focus se pose sur « Annuler » à l'ouverture.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  // Focus explicite plutôt que `autoFocus` : même comportement, mais sans la
  // magie du navigateur (et sans le warning jsx-a11y/no-autofocus).
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      {/* Fond cliquable = vrai <button>, masqué aux technologies d'assistance :
          c'est un raccourci souris, le chemin clavier étant la touche Échap. */}
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onCancel}
        className="absolute inset-0 cursor-default"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm rounded-3xl bg-[#1a1230] p-6 ring-1 ring-white/15"
      >
        <h2 className="font-display text-xl">{title}</h2>
        {message ? (
          <p className="mt-2 text-sm text-white/70">{message}</p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <Button ref={cancelRef} variant="ghost" full onClick={onCancel}>
            {cancelLabel ?? t("common.cancel")}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            full
            onClick={onConfirm}
          >
            {confirmLabel ?? t("common.confirm")}
          </Button>
        </div>
      </div>
    </div>
  );
}
