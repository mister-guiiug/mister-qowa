import { useT } from "../i18n";

export function PinBadge({ pin }: { pin: string }) {
  const t = useT();
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">
        {t("pin.label")}
      </p>
      <p className="font-display text-5xl tracking-[0.25em] text-brand-soft">
        {pin}
      </p>
    </div>
  );
}
