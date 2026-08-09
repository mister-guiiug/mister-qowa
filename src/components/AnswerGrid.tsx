import { Triangle, Diamond, Circle, Square } from "lucide-react";
import type { ComponentType } from "react";
import type { QuizOption } from "@shared/contracts";

// Couleur ET forme (a11y : ne pas distinguer par la seule couleur).
// Le jaune exige un texte SOMBRE (blanc sur #d89e00 = contraste 2,4:1 < 4,5).
const STYLES: {
  bg: string;
  fg: string;
  Icon: ComponentType<{ className?: string }>;
}[] = [
  { bg: "bg-answer-red", fg: "text-white", Icon: Triangle },
  { bg: "bg-answer-blue", fg: "text-white", Icon: Diamond },
  { bg: "bg-answer-yellow", fg: "text-[#1a1230]", Icon: Circle },
  { bg: "bg-answer-green", fg: "text-white", Icon: Square },
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
        const s = STYLES[i % STYLES.length]!;
        const dim = picked !== null && picked !== o.id;
        return (
          <button
            key={o.id}
            type="button"
            disabled={disabled}
            onClick={() => onPick(o.id)}
            aria-pressed={picked === o.id}
            className={`flex min-h-20 items-center gap-3 rounded-2xl p-4 text-left text-lg font-bold shadow-lg transition active:scale-[.98] disabled:cursor-not-allowed ${s.bg} ${s.fg} ${
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
