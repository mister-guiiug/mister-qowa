import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Check, X } from "lucide-react";
import { Screen, Button, Spinner } from "../lib/ui";
import { useAuthUid } from "../hooks/useAuthUid";
import { usePlayerView, useReactions } from "../hooks/useGameSubscription";
import { useGameStore } from "../store/gameStore";
import { submitAnswer, sendReaction } from "../firebase/api";
import { FloatingReactions, ReactionBar } from "../components/Reactions";
import { AnswerGrid } from "../components/AnswerGrid";
import { Countdown } from "../components/Countdown";
import { Leaderboard } from "../components/Leaderboard";
import { Podium } from "../components/Podium";
import { errMsg } from "../lib/err";

export function Play() {
  const { sessionId } = useParams();
  const nav = useNavigate();
  const uid = useAuthUid();
  const pseudo = useGameStore((s) => s.pseudo);
  const reset = useGameStore((s) => s.reset);
  const { state, current, reveal, leaderboard, score } = usePlayerView(
    sessionId ?? null,
    uid,
  );
  const reactions = useReactions(sessionId ?? null);
  const [picked, setPicked] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPicked(null);
    setText("");
  }, [current?.questionId]);

  async function pick(choice: string) {
    if (!sessionId || !current || picked) return;
    setPicked(choice);
    setError(null);
    try {
      await submitAnswer(sessionId, current.questionId, choice);
    } catch (e) {
      setError(errMsg(e));
      setPicked(null);
    }
  }

  if (!sessionId) return <Navigate to="/" replace />;
  if (!uid || !state)
    return (
      <Screen className="justify-center">
        <Spinner label="Connexion…" />
      </Screen>
    );

  const myRank = leaderboard.findIndex((e) => e.uid === uid);
  const ord = (r: number) => `${r + 1}${r === 0 ? "er" : "e"}`;

  return (
    <Screen>
      <FloatingReactions items={reactions} />
      {state === "LOBBY" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="font-display text-2xl">Bienvenue {pseudo} !</p>
          <p className="text-white/60">En attente du lancement par l’hôte…</p>
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
          <h2 className="font-display text-xl">{current.prompt}</h2>
          {current.mediaUrl ? (
            <img
              src={current.mediaUrl}
              alt=""
              className="max-h-48 w-full rounded-2xl object-contain"
            />
          ) : null}
          {current.options ? (
            <AnswerGrid
              options={current.options}
              onPick={pick}
              disabled={picked !== null}
              picked={picked}
            />
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (text.trim()) pick(text.trim());
              }}
              className="flex flex-col gap-3"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={picked !== null}
                maxLength={200}
                placeholder="Ta réponse…"
                className="rounded-2xl bg-white/10 px-4 py-3 text-lg outline-none ring-1 ring-white/15 focus:ring-brand"
              />
              <Button
                type="submit"
                full
                disabled={picked !== null || !text.trim()}
              >
                Envoyer
              </Button>
            </form>
          )}
          {picked ? (
            <p className="text-center text-white/60">
              Réponse envoyée ✓ — attends le résultat…
            </p>
          ) : null}
          {error ? (
            <p className="text-center text-sm text-rose-300">{error}</p>
          ) : null}
        </div>
      ) : null}

      {state === "LEADERBOARD" ? (
        <div className="flex flex-1 flex-col gap-6">
          {current && !current.scored ? (
            <div className="rounded-3xl bg-white/10 p-6 text-center">
              <p className="font-display text-2xl">Merci pour ton vote 🗳️</p>
            </div>
          ) : reveal ? (
            <div
              className={`rounded-3xl p-6 text-center ${
                reveal.correct ? "bg-answer-green/30" : "bg-answer-red/30"
              }`}
            >
              {reveal.correct ? (
                <Check className="mx-auto size-10" />
              ) : (
                <X className="mx-auto size-10" />
              )}
              <p className="mt-2 font-display text-2xl">
                {reveal.correct ? "Bonne réponse !" : "Raté !"}
              </p>
              <p className="text-white/80">+{reveal.awarded} pts</p>
            </div>
          ) : picked === null ? (
            <div className="rounded-3xl bg-answer-red/20 p-6 text-center">
              <p className="font-display text-2xl">Pas de réponse</p>
              <p className="text-white/70">+0 pt</p>
            </div>
          ) : (
            <p className="text-center text-white/60">Résultats…</p>
          )}
          <Leaderboard entries={leaderboard} highlightUid={uid} max={5} />
          {myRank >= 0 ? (
            <p className="text-center text-white/60">
              Tu es {ord(myRank)} · {score?.total ?? 0} pts
            </p>
          ) : null}
        </div>
      ) : null}

      {state === "PODIUM" ? (
        <div className="flex flex-1 flex-col justify-center gap-8">
          <Podium entries={leaderboard} />
          {myRank >= 0 ? (
            <p className="text-center font-display text-xl">
              Tu finis {ord(myRank)} ! 🎉
            </p>
          ) : null}
          <Button
            full
            variant="ghost"
            onClick={() => {
              reset();
              nav("/");
            }}
          >
            Quitter
          </Button>
        </div>
      ) : null}

      {state !== "LOBBY" ? (
        <div className="mt-auto pt-4">
          <ReactionBar onSend={(e) => void sendReaction(sessionId, e)} />
        </div>
      ) : null}
    </Screen>
  );
}
