import { useEffect } from "react";
import { Button } from "../lib/ui";

/**
 * Confirmation in-app (charte sombre, testable, accessible) en remplacement de
 * window.confirm. Échap annule ; le focus se pose sur « Annuler » à l'ouverture.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-[#1a1230] p-6 ring-1 ring-white/15"
      >
        <h2 className="font-display text-xl">{title}</h2>
        {message ? (
          <p className="mt-2 text-sm text-white/70">{message}</p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <Button variant="ghost" full autoFocus onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            full
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
