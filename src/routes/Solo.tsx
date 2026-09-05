import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X, Play, Share2 } from "lucide-react";
import { Screen, Button, Card } from "../lib/ui";
import {
  shareOrCopy,
  currentAppUrl,
} from "@mister-guiiug/dev-pwa-config/share";
import { AnswerGrid } from "../components/AnswerGrid";
import { TimerBar } from "../components/TimerBar";
import { feedback } from "../lib/feedback";
import { DEMO_QUIZZES } from "@shared/seed";
import { useQuizLibrary } from "../store/quizStore";
import { isCorrect, basePointsOf, publicQuestionFields } from "@shared/game";
import { computeScore } from "@shared/scoring";
import { STREAK_BONUS_PCT } from "@shared/gameState";
import type { Quiz } from "@shared/contracts";
import { useT } from "../i18n";

/** Mode solo : on joue un quiz à son rythme, 100 % local (aucun backend). */
export function Solo() {
  const t = useT();
  const nav = useNavigate();
  const myQuizzes = useQuizLibrary((s) => s.quizzes);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"question" | "reveal" | "done">(
    "question",
  );
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(0);
  const [lastAwarded, setLastAwarded] = useState(0);
  const [lastCorrect, setLastCorrect] = useState(false);

  const q = quiz?.questions[index];

  // Tick pour le compte à rebours pendant une question.
  useEffect(() => {
    if (phase !== "question" || !q) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [phase, index, q]);

  // Ambiance sonore pendant la question (solo) — sur phase/index, pas questionId.
  useEffect(() => {
    if (phase !== "question" || !q) {
      feedback.ambient.stop();
      return;
    }
    feedback.ambient.start(q.timeLimitMs);
    return () => feedback.ambient.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index]);

  function answer(choice: string | null) {
    if (!quiz || !q || phase !== "question") return;
    const correct = choice !== null && isCorrect(q, choice);
    const responseTimeMs = Date.now() - startedAt;
    const awarded =
      q.type === "poll"
        ? 0
        : computeScore({
            correct,
            responseTimeMs,
            timeLimitMs: q.timeLimitMs,
            basePoints: basePointsOf(q),
            streakBefore: streak,
            streakBonusPct: STREAK_BONUS_PCT,
          });
    setScore((s) => s + awarded);
    setStreak(correct ? streak + 1 : 0);
    if (correct) setMaxStreak((m) => Math.max(m, streak + 1));
    setPicked(choice);
    setLastAwarded(awarded);
    setLastCorrect(correct);
    setPhase("reveal");
    if (q.type !== "poll") (correct ? feedback.correct : feedback.wrong)();
  }

  // Temps écoulé -> on clôt la question (sans réponse).
  //
  // `set-state-in-effect` est désactivé sciemment : la source de vérité est une
  // horloge externe (l'intervalle qui alimente `now`), et c'est précisément le
  // cas d'usage d'un effet. Déplacer la détection dans le callback de
  // l'intervalle imposerait de garder `answer`/`q`/`startedAt` à jour dans des
  // refs, pour un gain nul et un risque réel sur le minuteur de jeu.
  useEffect(() => {
    if (phase === "question" && q && now && now - startedAt >= q.timeLimitMs) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      answer(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  function start(chosen: Quiz) {
    setQuiz(chosen);
    setIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setPhase("question");
    setPicked(null);
    setText("");
    // `start` n'est appelé que depuis un onClick : l'horloge est lue hors rendu.
    // Le compilateur ne peut pas le prouver depuis le corps du composant, d'où
    // la désactivation ciblée. Une seule lecture, pour éviter tout décalage.
    // eslint-disable-next-line react-hooks/purity
    const t0 = Date.now();
    setStartedAt(t0);
    setNow(t0);
  }

  function next() {
    if (!quiz) return;
    if (index + 1 >= quiz.questions.length) {
      setPhase("done");
      feedback.finish();
      return;
    }
    setIndex(index + 1);
    setPhase("question");
    setPicked(null);
    setText("");
    setStartedAt(Date.now());
    setNow(Date.now());
  }

  const back = (
    <button
      type="button"
      onClick={() => (quiz ? setQuiz(null) : nav("/"))}
      className="mb-4 inline-flex items-center gap-1 self-start text-sm text-white/60 hover:text-white"
    >
      <ArrowLeft className="size-4" />{" "}
      {quiz ? t("solo.changeQuiz") : t("common.home")}
    </button>
  );

  // --- Sélection du quiz ---
  if (!quiz) {
    const all = [...myQuizzes, ...DEMO_QUIZZES];
    return (
      <Screen>
        {back}
        <h1 className="font-display text-3xl">{t("solo.title")}</h1>
        <div className="mt-6 flex flex-col gap-3">
          {all.map((qz) => (
            <Card
              key={qz.id}
              className="flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-semibold">{qz.title}</p>
                <p className="text-sm text-white/60">
                  {t("create.questionsCount", { n: qz.questions.length })}
                </p>
              </div>
              <Button onClick={() => start(qz)}>
                <Play className="size-4" /> {t("solo.play")}
              </Button>
            </Card>
          ))}
        </div>
      </Screen>
    );
  }

  // --- Fin ---
  if (phase === "done") {
    return (
      <Screen className="justify-center text-center">
        <h1 className="font-display text-4xl">{t("solo.finished")}</h1>
        <p className="mt-4 font-display text-2xl text-brand-soft">
          {t("common.pts", { n: score })}
        </p>
        {maxStreak >= 2 ? (
          <p className="mt-1 text-white/70">
            {t("solo.bestStreak", { n: maxStreak })}
          </p>
        ) : null}
        <div className="mt-10 flex flex-col gap-3">
          <Button full onClick={() => start(quiz)}>
            {t("solo.replay")}
          </Button>
          <Button
            full
            variant="ghost"
            onClick={() =>
              void shareOrCopy({
                title: "Mister Qowa",
                text: t("solo.shareText", { score }),
                url: currentAppUrl(),
              })
            }
          >
            <Share2 className="size-4" /> {t("play.shareScore")}
          </Button>
          <Button full variant="ghost" onClick={() => setQuiz(null)}>
            {t("solo.otherQuiz")}
          </Button>
        </div>
      </Screen>
    );
  }

  if (!q) return null;
  const pub = publicQuestionFields(q, index, quiz.questions.length);
  const options = "options" in pub ? pub.options : undefined;
  const remaining = Math.max(
    0,
    Math.ceil((q.timeLimitMs - (now - startedAt)) / 1000),
  );

  return (
    <Screen>
      {back}
      <div className="flex items-center justify-between text-white/60">
        <span>
          {t("common.questionN", {
            n: index + 1,
            total: quiz.questions.length,
          })}
        </span>
        <span className="font-display text-2xl tabular-nums">
          {phase === "question" ? t("solo.secondsShort", { n: remaining }) : ""}
        </span>
        <span className="font-display tabular-nums">
          {streak >= 2 ? (
            <span aria-hidden className="mr-2 text-amber-300">
              🔥{streak}
            </span>
          ) : null}
          {t("common.pts", { n: score })}
        </span>
      </div>
      {phase === "question" ? (
        <div className="mt-3">
          <TimerBar
            endsAt={startedAt + q.timeLimitMs}
            timeLimitMs={q.timeLimitMs}
          />
        </div>
      ) : null}
      <h2 className="mt-4 font-display text-xl">{q.prompt}</h2>
      {q.mediaUrl ? (
        <div className="mt-3 h-48 w-full overflow-hidden rounded-2xl bg-white/5">
          <img
            src={q.mediaUrl}
            alt={q.mediaAlt ?? ""}
            decoding="async"
            className="h-full w-full object-contain"
          />
        </div>
      ) : null}

      {phase === "question" ? (
        <div className="mt-6">
          {options ? (
            <AnswerGrid options={options} onPick={(id) => answer(id)} />
          ) : (
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                if (text.trim()) answer(text.trim());
              }}
              className="flex flex-col gap-3"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={200}
                placeholder={t("solo.answerPlaceholder")}
                aria-label={t("solo.answerAria")}
                className="rounded-2xl bg-white/10 px-4 py-3 text-lg outline-none ring-1 ring-white/15 focus:ring-brand"
              />
              <Button type="submit" full disabled={!text.trim()}>
                {t("solo.validate")}
              </Button>
            </form>
          )}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {q.type === "poll" ? (
            <div
              role="status"
              className="rounded-3xl bg-white/10 p-6 text-center"
            >
              <p className="font-display text-2xl">{t("solo.voteRecorded")}</p>
            </div>
          ) : (
            <div
              role="status"
              aria-live="polite"
              className={`rounded-3xl p-6 text-center ${lastCorrect ? "bg-answer-green/30" : "bg-answer-red/30"}`}
            >
              {lastCorrect ? (
                <Check className="mx-auto size-10" />
              ) : (
                <X className="mx-auto size-10" />
              )}
              <p className="mt-2 font-display text-2xl">
                {picked === null
                  ? t("solo.timeUp")
                  : lastCorrect
                    ? t("solo.correct")
                    : t("solo.wrong")}
              </p>
              <p className="text-white/80">
                {t("play.awarded", { n: lastAwarded })}
              </p>
            </div>
          )}
          {q.explanation && q.type !== "poll" ? (
            <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/80">
              💡 {q.explanation}
            </p>
          ) : null}
          <Button full onClick={next}>
            {index + 1 >= quiz.questions.length
              ? t("solo.seeScore")
              : t("solo.next")}
          </Button>
        </div>
      )}
    </Screen>
  );
}
