export function PinBadge({ pin }: { pin: string }) {
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-white/50">
        Code PIN
      </p>
      <p className="font-display text-5xl tracking-[0.25em] text-brand-soft">
        {pin}
      </p>
    </div>
  );
}
