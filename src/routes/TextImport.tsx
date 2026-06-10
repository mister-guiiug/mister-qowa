import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Screen, Button } from "../lib/ui";
import { parseQuizText } from "../lib/quizImport";
import { validateDraft } from "../lib/quizDraft";
import { saveDraft } from "../lib/draft";
import { useT } from "../i18n";

/** Import d'un quiz depuis du texte collé (sans IA, sans clé) → éditeur. */
export function TextImport() {
  const t = useT();
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  function doImport() {
    const draft = parseQuizText(text, title || t("textImport.defaultTitle"));
    const errs = validateDraft(draft);
    if (errs.length) {
      setErrors(errs.map((e) => t(e.key, e.vars)));
      return;
    }
    saveDraft(draft);
    nav("/create/new");
  }

  return (
    <Screen>
      <button
        type="button"
        onClick={() => nav("/create")}
        className="mb-4 inline-flex items-center gap-1 self-start text-sm text-white/60 hover:text-white"
      >
        <ArrowLeft className="size-4" /> {t("common.back")}
      </button>
      <h1 className="font-display text-3xl">{t("textImport.title")}</h1>
      <p className="mt-2 whitespace-pre-line text-sm text-white/60">
        {t("textImport.help")}
      </p>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("textImport.titlePlaceholder")}
        className="mt-4 rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/15 focus:ring-brand"
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        placeholder={t("textImport.placeholder")}
        aria-label={t("textImport.title")}
        className="mt-3 rounded-2xl bg-white/10 px-4 py-3 font-mono text-sm outline-none ring-1 ring-white/15 focus:ring-brand"
      />

      {errors.length ? (
        <ul className="mt-3 flex flex-col gap-1 rounded-xl bg-rose-500/20 px-4 py-2 text-sm text-rose-200">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      ) : null}

      <Button full className="mt-4" disabled={!text.trim()} onClick={doImport}>
        {t("textImport.action")}
      </Button>
    </Screen>
  );
}
