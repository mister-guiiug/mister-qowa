import { Triangle, Diamond, Circle, Square } from "lucide-react";
import type { ComponentType } from "react";
import type { QuizOption } from "@shared/contracts";

// Couleur ET forme (a11y : ne pas distinguer par la seule couleur).
const STYLES: { bg: string; Icon: ComponentType<{ className?: string }> }[] = [
  { bg: "bg-answer-red", Icon: Triangle },
  { bg: "bg-answer-blue", Icon: Diamond },
  { bg: "bg-answer-yellow", Icon: Circle },
  { bg: "bg-answer-green", Icon: Square },
];

export function AnswerGrid({
  options,
  onPick,
  disabled = false,
  picked = null,
}: {
  options: QuizOption[];
  onPick: (id: string) => void;
  disabled?: boolean;
  picked?: string | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {options.map((o, i) => {
        const s = STYLES[i % STYLES.length];
        const dim = picked !== null && picked !== o.id;
        return (
          <button
            key={o.id}
            type="button"
            disabled={disabled}
            onClick={() => onPick(o.id)}
            aria-pressed={picked === o.id}
            className={`flex min-h-20 items-center gap-3 rounded-2xl p-4 text-left text-lg font-bold text-white shadow-lg transition active:scale-[.98] disabled:cursor-not-allowed ${s.bg} ${
              dim ? "opacity-40" : "opacity-100"
            }`}
          >
            <s.Icon className="size-6 shrink-0" />
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
