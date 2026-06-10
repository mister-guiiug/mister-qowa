import { useEffect, useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Check, X, Share2 } from "lucide-react";
import { Screen, Button, Spinner } from "../lib/ui";
import { shareOrCopy } from "../lib/share";
import { useAuthUid } from "../hooks/useAuthUid";
import {
  usePlayerView,
  useReactions,
  useTeamLeaderboard,
} from "../hooks/useGameSubscription";
import { useGameStore } from "../store/gameStore";
import { useProfile } from "../store/profileStore";
import { submitAnswer, sendReaction } from "../firebase/api";
import { FloatingReactions, ReactionBar } from "../components/Reactions";
import { TeamLeaderboard } from "../components/TeamLeaderboard";
import { AnswerGrid } from "../components/AnswerGrid";
import { Countdown } from "../components/Countdown";
import { TimerBar } from "../components/TimerBar";
import { Leaderboard } from "../components/Leaderboard";
import { Podium } from "../components/Podium";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { useServerOffset, serverNow } from "../hooks/useServerTime";
import { feedback } from "../lib/feedback";
import { useErr, useT } from "../i18n";

export function Play() {
  const t = useT();
  const err = useErr();
  const offset = useServerOffset();
  const { sessionId } = useParams();
  const nav = useNavigate();
  const uid = useAuthUid();
  const pseudo = useGameStore((s) => s.pseudo);
  const reset = useGameStore((s) => s.reset);
  const recordGame = useProfile((s) => s.recordGame);
  const {
    state,
    current,
    reveal,
    correctChoice,
    explanation,
    kicked,
    paused,
    leaderboard,
    score,
  } = usePlayerView(sessionId ?? null, uid);
  const reactions = useReactions(sessionId ?? null);
  const teamStandings = useTeamLeaderboard(sessionId ?? null);
  const [picked, setPicked] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Reset à chaque nouvelle question OU re-pose de la même (activatedAt change).
  useEffect(() => {
    setPicked(null);
    setText("");
  }, [current?.questionId, current?.activatedAt]);

  // Session injoignable après un délai : sortie de secours plutôt qu'un spinner figé.
  useEffect(() => {
    if (state) {
      setNotFound(false);
      return;
    }
    const id = setTimeout(() => setNotFound(true), 8000);
    return () => clearTimeout(id);
  }, [state]);

  // Son/vibration au résultat de la question.
  useEffect(() => {
    if (state !== "LEADERBOARD" || !reveal) return;
    if (reveal.correct) feedback.correct();
    else feedback.wrong();
  }, [state, reveal]);

  // Fanfare au podium.
  useEffect(() => {
    if (state === "PODIUM") feedback.finish();
  }, [state]);

  // Ambiance sonore pendant la question (coupée en pause, à la clôture, au kick).
  useEffect(() => {
    if (state !== "QUESTION_ACTIVE" || !current || paused || kicked) {
      feedback.ambient.stop();
      return;
    }
    const remaining =
      current.activatedAt + current.timeLimitMs - serverNow(offset);
    feedback.ambient.start(Math.max(0, remaining));
    return () => feedback.ambient.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state,
    paused,
    kicked,
    current?.questionId,
    current?.activatedAt,
    current?.timeLimitMs,
    offset,
  ]);

  // Comptabilise la partie dans le profil local (idempotent par sessionId :
  // recordGame ignore un 2e appel pour la même session).
  useEffect(() => {
    if (state !== "PODIUM" || !sessionId || !uid) return;
    const rank = leaderboard.findIndex((e) => e.uid === uid);
    if (rank >= 0) {
      recordGame({ sessionId, rank: rank + 1, points: score?.total ?? 0 });
    }
  }, [state, sessionId, uid, leaderboard, score, recordGame]);

  const eliminated = score?.eliminated === true;

  async function pick(choice: string) {
    if (!sessionId || !current || picked || paused || eliminated) return;
    setPicked(choice);
    setError(null);
    try {
      await submitAnswer(sessionId, current.questionId, choice);
    } catch (e) {
      setError(err(e));
      setPicked(null);
    }
  }

  if (!sessionId) return <Navigate to="/" replace />;
  if (kicked)
    return (
      <Screen className="justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="font-display text-2xl">{t("play.kicked")}</p>
          <p className="text-white/60">{t("play.kickedMsg")}</p>
          <Button
            variant="ghost"
            onClick={() => {
              reset();
              nav("/");
            }}
          >
            {t("common.toHome")}
          </Button>
        </div>
      </Screen>
    );
  if (!uid || !state)
    return (
      <Screen className="justify-center">
        {notFound ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="font-display text-2xl">{t("common.notFound")}</p>
            <p className="text-white/60">{t("common.sessionGone")}</p>
            <Button
              variant="ghost"
              onClick={() => {
                reset();
                nav("/");
              }}
            >
              {t("common.toHome")}
            </Button>
          </div>
        ) : (
          <Spinner label={t("common.connecting")} />
        )}
      </Screen>
    );

  const myRank = leaderboard.findIndex((e) => e.uid === uid);
  const ord = (r: number) => t("common.ordinal", { n: r + 1 });

  return (
    <Screen>
      <FloatingReactions items={reactions} />
      <ConnectionBanner />
      {state === "LOBBY" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
          <p className="font-display text-2xl">
            {t("play.welcome", { pseudo: pseudo ?? "" })}
          </p>
          <p className="text-white/60">{t("play.waiting")}</p>
        </div>
      ) : null}

      {state === "QUESTION_ACTIVE" && current ? (
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex items-center justify-between text-white/60">
            <span className="flex items-center gap-2">
              {t("common.questionN", {
                n: current.index + 1,
                total: current.total,
              })}
              {score && score.streak >= 2 ? (
                <span aria-hidden className="font-semibold text-amber-300">
                  🔥 {score.streak}
                </span>
              ) : null}
            </span>
            {paused ? (
              <span className="rounded-xl bg-amber-500/20 px-3 py-1 font-display text-amber-200">
                {t("play.pauseBadge")}
              </span>
            ) : (
              <Countdown endsAt={current.activatedAt + current.timeLimitMs} />
            )}
          </div>
          {!paused ? (
            <TimerBar
              endsAt={current.activatedAt + current.timeLimitMs}
              timeLimitMs={current.timeLimitMs}
              offset={offset}
            />
          ) : null}
          <h2 className="font-display text-xl">{current.prompt}</h2>
          {current.mediaUrl ? (
            <div className="h-48 w-full overflow-hidden rounded-2xl bg-white/5">
              <img
                src={current.mediaUrl}
                alt={current.mediaAlt ?? ""}
                decoding="async"
                className="h-full w-full object-contain"
              />
            </div>
          ) : null}
          {eliminated ? (
            <div
              role="status"
              className="rounded-3xl bg-white/10 p-6 text-center"
            >
              <p className="font-display text-2xl">{t("play.eliminated")}</p>
              <p className="text-white/60">{t("play.eliminatedMsg")}</p>
            </div>
          ) : null}
          {current.options ? (
            <AnswerGrid
              options={current.options}
              onPick={pick}
              disabled={picked !== null || paused || eliminated}
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
                disabled={picked !== null || paused || eliminated}
                maxLength={200}
                placeholder={t("play.answerPlaceholder")}
                className="rounded-2xl bg-white/10 px-4 py-3 text-lg outline-none ring-1 ring-white/15 focus:ring-brand"
              />
              <Button
                type="submit"
                full
                disabled={
                  picked !== null || paused || eliminated || !text.trim()
                }
              >
                {t("play.send")}
              </Button>
            </form>
          )}
          {picked ? (
            <p className="text-center text-white/60">{t("play.sent")}</p>
          ) : null}
          {error ? (
            <p className="text-center text-sm text-rose-300">{error}</p>
          ) : null}
        </div>
      ) : null}

      {state === "LEADERBOARD" ? (
        <div className="flex flex-1 flex-col gap-6">
          {current && !current.scored ? (
            <div
              role="status"
              className="rounded-3xl bg-white/10 p-6 text-center"
            >
              <p className="font-display text-2xl">{t("play.voteThanks")}</p>
            </div>
          ) : reveal ? (
            <div
              role="status"
              aria-live="polite"
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
                {reveal.correct ? t("play.correct") : t("play.wrong")}
              </p>
              <p className="text-white/80">
                {t("play.awarded", { n: reveal.awarded })}
                {reveal.correct && score && score.streak >= 2 ? (
                  <span aria-hidden> · 🔥 {score.streak}</span>
                ) : null}
              </p>
            </div>
          ) : picked === null ? (
            <div
              role="status"
              className="rounded-3xl bg-answer-red/20 p-6 text-center"
            >
              <p className="font-display text-2xl">{t("play.noAnswer")}</p>
              <p className="text-white/70">{t("play.zeroPt")}</p>
            </div>
          ) : (
            <p className="text-center text-white/60">{t("play.results")}</p>
          )}
          {current?.type === "free_text" && correctChoice ? (
            <p className="text-center text-white/80">
              {t("play.expectedAnswer", { answer: correctChoice })}
            </p>
          ) : null}
          {current?.options && correctChoice ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {current.options.map((o) => {
                const ok = o.id === correctChoice;
                const myWrong = o.id === picked && !ok;
                return (
                  <div
                    key={o.id}
                    className={`flex items-center gap-2 rounded-xl p-3 text-sm font-semibold ${
                      ok
                        ? "bg-answer-green/40"
                        : myWrong
                          ? "bg-answer-red/40"
                          : "bg-white/5 text-white/50"
                    }`}
                  >
                    {ok ? (
                      <Check className="size-4 shrink-0" />
                    ) : myWrong ? (
                      <X className="size-4 shrink-0" />
                    ) : null}
                    <span>{o.label}</span>
                  </div>
                );
              })}
            </div>
          ) : null}
          {explanation ? (
            <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/80">
              💡 {explanation}
            </p>
          ) : null}
          {teamStandings.length ? (
            <TeamLeaderboard standings={teamStandings} />
          ) : null}
          <Leaderboard entries={leaderboard} highlightUid={uid} max={5} />
          {myRank >= 0 ? (
            <p className="text-center text-white/60">
              {t("play.rankLine", {
                rank: ord(myRank),
                pts: score?.total ?? 0,
              })}
            </p>
          ) : null}
        </div>
      ) : null}

      {state === "PODIUM" ? (
        <div className="flex flex-1 flex-col justify-center gap-8">
          {teamStandings.length ? (
            <TeamLeaderboard standings={teamStandings} />
          ) : null}
          <Podium entries={leaderboard} />
          {myRank >= 0 ? (
            <p className="text-center font-display text-xl">
              {t("play.podiumRank", { rank: ord(myRank) })}
            </p>
          ) : null}
          {myRank >= 0 ? (
            <Button
              full
              variant="ghost"
              onClick={() =>
                void shareOrCopy({
                  title: "Mister Qowa",
                  text: t("play.shareScoreText", {
                    rank: ord(myRank),
                    pts: score?.total ?? 0,
                  }),
                  url: `${window.location.origin}${import.meta.env.BASE_URL}`,
                })
              }
            >
              <Share2 className="size-4" /> {t("play.shareScore")}
            </Button>
          ) : null}
          <Button
            full
            variant="ghost"
            onClick={() => {
              reset();
              nav("/");
            }}
          >
            {t("play.quit")}
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
