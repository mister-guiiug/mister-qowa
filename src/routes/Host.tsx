import { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Screen, Button, Spinner } from "../lib/ui";
import { useHostView, useAnswerStats } from "../hooks/useGameSubscription";
import { useServerOffset } from "../hooks/useServerTime";
import { AnswerDistribution } from "../components/AnswerDistribution";
import { QRCodeSVG } from "qrcode.react";
import { useGameStore } from "../store/gameStore";
import { nextQuestion, closeQuestion, endGame } from "../firebase/api";
import { PinBadge } from "../components/PinBadge";
import { Countdown } from "../components/Countdown";
import { Leaderboard } from "../components/Leaderboard";
import { Podium } from "../components/Podium";
import { errMsg } from "../lib/err";

export function Host() {
  const { sessionId } = useParams();
  const nav = useNavigate();
  const pin = useGameStore((s) => s.pin);
  const quiz = useGameStore((s) => s.hostQuiz);
  const reset = useGameStore((s) => s.reset);
  const { state, current, players, playerCount, leaderboard } = useHostView(
    sessionId ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const offset = useServerOffset();
  const stats = useAnswerStats(sessionId ?? null, current?.questionId ?? null);

  // Auto-clôture quand le compte à rebours atteint 0 (closeQuestion est idempotent).
  useEffect(() => {
    if (state !== "QUESTION_ACTIVE" || !current || !quiz || !sessionId) return;
    const ms =
      current.activatedAt + current.timeLimitMs - (Date.now() + offset);
    const id = setTimeout(
      () => void closeQuestion(sessionId, quiz, current.index),
      Math.max(0, ms) + 400,
    );
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, current?.questionId, quiz, sessionId, offset]);

  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  if (!sessionId) return <Navigate to="/" replace />;
  if (!state)
    return (
      <Screen className="justify-center">
        <Spinner label="Connexion à la partie…" />
      </Screen>
    );

  const isLast = current ? current.index >= current.total - 1 : false;
  const curQ = quiz && current ? quiz.questions[current.index] : undefined;
  const correctId =
    curQ?.type === "multiple_choice"
      ? curQ.correctOptionId
      : curQ?.type === "true_false"
        ? curQ.correct
          ? "true"
          : "false"
        : undefined;
  const joinUrl = pin
    ? `${window.location.origin}${import.meta.env.BASE_URL}#/join?pin=${pin}`
    : "";

  return (
    <Screen>
      {error ? (
        <p className="mb-4 rounded-xl bg-rose-500/20 px-4 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {state === "LOBBY" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-8">
          {pin ? <PinBadge pin={pin} /> : null}
          {pin ? (
            <div className="rounded-2xl bg-white p-3">
              <QRCodeSVG
                value={joinUrl}
                size={148}
                bgColor="#ffffff"
                fgColor="#0f0a1e"
              />
            </div>
          ) : null}
          <p className="text-white/70">
            {playerCount} joueur{playerCount > 1 ? "s" : ""} connecté
            {playerCount > 1 ? "s" : ""}
          </p>
          <div className="flex max-h-40 flex-wrap justify-center gap-2 overflow-auto">
            {Object.values(players).map((p, i) => (
              <span
                key={i}
                className="rounded-full bg-white/10 px-3 py-1 text-sm"
              >
                {p.pseudo}
              </span>
            ))}
          </div>
          <Button
            full
            disabled={busy || playerCount === 0 || !quiz}
            onClick={() => quiz && act(() => nextQuestion(sessionId, quiz, 0))}
          >
            Démarrer la partie
          </Button>
        </div>
      ) : null}

      {state === "QUESTION_ACTIVE" && current ? (
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex items-center justify-between text-white/60">
            <span>
              Question {current.index + 1}/{current.total}
            </span>
            <Countdown endsAt={current.activatedAt + current.timeLimitMs} />
          </div>
          <h2 className="font-display text-2xl">{current.prompt}</h2>
          {current.options ? (
            <ul className="grid grid-cols-2 gap-2">
              {current.options.map((o) => (
                <li
                  key={o.id}
                  className="rounded-xl bg-white/5 p-3 font-medium"
                >
                  {o.label}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-center text-white/70">
            {stats.count}/{playerCount} ont répondu
          </p>
          <Button
            full
            variant="danger"
            disabled={busy || !quiz}
            onClick={() =>
              quiz && act(() => closeQuestion(sessionId, quiz, current.index))
            }
          >
            Clore maintenant
          </Button>
        </div>
      ) : null}

      {state === "LEADERBOARD" ? (
        <div className="flex flex-1 flex-col gap-6">
          <h2 className="text-center font-display text-2xl">Classement</h2>
          {current?.options ? (
            <AnswerDistribution
              options={current.options}
              byChoice={stats.byChoice}
              total={stats.count}
              correctId={correctId}
            />
          ) : null}
          <Leaderboard entries={leaderboard} />
          <div className="mt-auto flex flex-col gap-2">
            {!isLast ? (
              <Button
                full
                disabled={busy || !quiz || !current}
                onClick={() =>
                  quiz &&
                  current &&
                  act(() => nextQuestion(sessionId, quiz, current.index + 1))
                }
              >
                Question suivante
              </Button>
            ) : null}
            <Button
              full
              variant={isLast ? "primary" : "ghost"}
              disabled={busy}
              onClick={() => act(() => endGame(sessionId))}
            >
              Terminer &amp; podium
            </Button>
          </div>
        </div>
      ) : null}

      {state === "PODIUM" ? (
        <div className="flex flex-1 flex-col justify-center gap-8">
          <h2 className="text-center font-display text-3xl">Podium 🎉</h2>
          <Podium entries={leaderboard} />
          <Button
            full
            variant="ghost"
            onClick={() => {
              reset();
              nav("/");
            }}
          >
            Nouvelle partie
          </Button>
        </div>
      ) : null}
    </Screen>
  );
}
