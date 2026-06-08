import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, X, Play } from "lucide-react";
import { Screen, Button, Card } from "../lib/ui";
import { AnswerGrid } from "../components/AnswerGrid";
import { DEMO_QUIZZES } from "@shared/seed";
import { useQuizLibrary } from "../store/quizStore";
import { isCorrect, basePointsOf, publicQuestionFields } from "@shared/game";
import { computeScore } from "@shared/scoring";
import { STREAK_BONUS_PCT } from "@shared/gameState";
import type { Quiz } from "@shared/contracts";

/** Mode solo : on joue un quiz à son rythme, 100 % local (aucun backend). */
export function Solo() {
  const nav = useNavigate();
  const myQuizzes = useQuizLibrary((s) => s.quizzes);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"question" | "reveal" | "done">(
    "question",
  );
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
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
    setPicked(choice);
    setLastAwarded(awarded);
    setLastCorrect(correct);
    setPhase("reveal");
  }

  // Temps écoulé -> on clôt la question (sans réponse).
  useEffect(() => {
    if (phase === "question" && q && now && now - startedAt >= q.timeLimitMs) {
      answer(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  function start(chosen: Quiz) {
    setQuiz(chosen);
    setIndex(0);
    setScore(0);
    setStreak(0);
    setPhase("question");
    setPicked(null);
    setText("");
    setStartedAt(Date.now());
    setNow(Date.now());
  }

  function next() {
    if (!quiz) return;
    if (index + 1 >= quiz.questions.length) {
      setPhase("done");
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
      <ArrowLeft className="size-4" /> {quiz ? "Changer de quiz" : "Accueil"}
    </button>
  );

  // --- Sélection du quiz ---
  if (!quiz) {
    const all = [...myQuizzes, ...DEMO_QUIZZES];
    return (
      <Screen>
        {back}
        <h1 className="font-display text-3xl">Jouer en solo</h1>
        <div className="mt-6 flex flex-col gap-3">
          {all.map((qz) => (
            <Card
              key={qz.id}
              className="flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-semibold">{qz.title}</p>
                <p className="text-sm text-white/60">
                  {qz.questions.length} questions
                </p>
              </div>
              <Button onClick={() => start(qz)}>
                <Play className="size-4" /> Jouer
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
        <h1 className="font-display text-4xl">Terminé ! 🎉</h1>
        <p className="mt-4 font-display text-2xl text-brand-soft">
          {score} pts
        </p>
        <div className="mt-10 flex flex-col gap-3">
          <Button full onClick={() => start(quiz)}>
            Rejouer
          </Button>
          <Button full variant="ghost" onClick={() => setQuiz(null)}>
            Autre quiz
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
          Question {index + 1}/{quiz.questions.length}
        </span>
        <span className="font-display text-2xl tabular-nums">
          {phase === "question" ? `${remaining}s` : ""}
        </span>
        <span className="font-display tabular-nums">{score} pts</span>
      </div>
      <h2 className="mt-4 font-display text-xl">{q.prompt}</h2>

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
                placeholder="Ta réponse…"
                aria-label="Ta réponse"
                className="rounded-2xl bg-white/10 px-4 py-3 text-lg outline-none ring-1 ring-white/15 focus:ring-brand"
              />
              <Button type="submit" full disabled={!text.trim()}>
                Valider
              </Button>
            </form>
          )}
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {q.type === "poll" ? (
            <div className="rounded-3xl bg-white/10 p-6 text-center">
              <p className="font-display text-2xl">Vote enregistré 🗳️</p>
            </div>
          ) : (
            <div
              className={`rounded-3xl p-6 text-center ${lastCorrect ? "bg-answer-green/30" : "bg-answer-red/30"}`}
            >
              {lastCorrect ? (
                <Check className="mx-auto size-10" />
              ) : (
                <X className="mx-auto size-10" />
              )}
              <p className="mt-2 font-display text-2xl">
                {picked === null
                  ? "Temps écoulé !"
                  : lastCorrect
                    ? "Bonne réponse !"
                    : "Raté !"}
              </p>
              <p className="text-white/80">+{lastAwarded} pts</p>
            </div>
          )}
          <Button full onClick={next}>
            {index + 1 >= quiz.questions.length ? "Voir le score" : "Suivant"}
          </Button>
        </div>
      )}
    </Screen>
  );
}
