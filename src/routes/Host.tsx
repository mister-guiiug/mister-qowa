import { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import {
  X,
  Share2,
  SkipForward,
  RefreshCw,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { Screen, Button, Spinner } from "../lib/ui";
import {
  useHostView,
  useAnswerStats,
  useReactions,
  useTeamLeaderboard,
  useSessionMeta,
} from "../hooks/useGameSubscription";
import { useServerOffset, serverNow } from "../hooks/useServerTime";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { ConnectionBanner } from "../components/ConnectionBanner";
import { feedback } from "../lib/feedback";
import { AnswerDistribution } from "../components/AnswerDistribution";
import { QRCodeSVG } from "qrcode.react";
import { useGameStore } from "../store/gameStore";
import { useQuizLibrary } from "../store/quizStore";
import {
  nextQuestion,
  closeQuestion,
  endGame,
  sendReaction,
  skipQuestion,
  restartSession,
  closeSession,
  kickPlayer,
  pauseQuestion,
  replayQuestion,
} from "../firebase/api";
import { shareOrCopy } from "../lib/share";
import { FloatingReactions, ReactionBar } from "../components/Reactions";
import { TeamLeaderboard } from "../components/TeamLeaderboard";
import { PinBadge } from "../components/PinBadge";
import { Countdown } from "../components/Countdown";
import { TimerBar } from "../components/TimerBar";
import { Leaderboard } from "../components/Leaderboard";
import { Podium } from "../components/Podium";
import { useErr, useT } from "../i18n";

export function Host() {
  const t = useT();
  const err = useErr();
  const { sessionId } = useParams();
  const nav = useNavigate();
  const pin = useGameStore((s) => s.pin);
  const quiz = useGameStore((s) => s.hostQuiz);
  const reset = useGameStore((s) => s.reset);
  const setHost = useGameStore((s) => s.setHost);
  const {
    state,
    current,
    players,
    playerCount,
    scores,
    paused,
    eliminationMode,
    leaderboard,
  } = useHostView(sessionId ?? null);
  const eliminatedCount = Object.values(scores).filter(
    (s) => s.eliminated,
  ).length;
  const survivors = Math.max(0, playerCount - eliminatedCount);
  const { busy, error, setError, run: act } = useAsyncAction();
  const [notFound, setNotFound] = useState(false);
  const [quizLost, setQuizLost] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const { quizId: metaQuizId, pin: metaPin } = useSessionMeta(
    sessionId ?? null,
  );
  const offset = useServerOffset();
  const stats = useAnswerStats(sessionId ?? null, current?.questionId ?? null);
  const reactions = useReactions(sessionId ?? null);
  const teamStandings = useTeamLeaderboard(sessionId ?? null);

  // Auto-clôture quand le compte à rebours atteint 0 (closeQuestion est idempotent).
  // Deps exhaustives (activatedAt/timeLimitMs/index) + erreurs remontées.
  // En pause : on n'arme pas le timer (la reprise étend timeLimitMs → ré-armement).
  useEffect(() => {
    if (state !== "QUESTION_ACTIVE" || !current || !quiz || !sessionId) return;
    if (paused) return;
    const ms = current.activatedAt + current.timeLimitMs - serverNow(offset);
    const id = setTimeout(
      () =>
        closeQuestion(sessionId, quiz, current.index).catch((e) =>
          setError(err(e)),
        ),
      Math.max(0, ms) + 400,
    );
    return () => clearTimeout(id);
    // deps volontairement primitives (pas l'objet `current` qui change à chaque snapshot)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state,
    paused,
    current?.questionId,
    current?.activatedAt,
    current?.timeLimitMs,
    current?.index,
    quiz,
    sessionId,
    offset,
    setError,
  ]);

  // Session injoignable après un délai : on ne reste pas bloqué sur le spinner.
  useEffect(() => {
    if (state) {
      setNotFound(false);
      return;
    }
    const id = setTimeout(() => setNotFound(true), 8000);
    return () => clearTimeout(id);
  }, [state]);

  // Reprise host : l'état existe (RTDB) mais le quiz local est perdu (store vidé
  // ou autre onglet). On le reconstruit depuis la bibliothèque locale via
  // meta.quizId (jamais depuis RTDB — aucune réponse exposée) ; à défaut, on
  // signale une salle non récupérable sur cet appareil plutôt qu'un gel muet.
  useEffect(() => {
    if (quiz || !state || !sessionId || !metaQuizId || !metaPin) return;
    const found = useQuizLibrary.getState().get(metaQuizId);
    if (found) {
      setHost({ sessionId, pin: metaPin, quiz: found });
      setQuizLost(false);
    } else {
      setQuizLost(true);
    }
  }, [quiz, state, sessionId, metaQuizId, metaPin, setHost]);

  // Fanfare au podium (host).
  useEffect(() => {
    if (state === "PODIUM") feedback.finish();
  }, [state]);

  if (!sessionId) return <Navigate to="/" replace />;
  if (!state)
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
          <Spinner label={t("host.connecting")} />
        )}
      </Screen>
    );

  // L'état existe mais le quiz local est perdu : reprise en cours (spinner) ou,
  // si le quiz n'est pas dans la bibliothèque de cet appareil, écran dédié pour
  // clôturer la salle — au lieu d'une partie gelée pour tous les joueurs.
  if (!quiz)
    return (
      <Screen className="justify-center">
        {quizLost ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="font-display text-2xl">{t("host.quizLostTitle")}</p>
            <p className="max-w-sm text-white/60">{t("host.quizLostBody")}</p>
            <Button
              variant="danger"
              onClick={() => {
                closeSession(sessionId, metaPin ?? pin).catch(() => undefined);
                reset();
                nav("/");
              }}
            >
              {t("host.closeRoom")}
            </Button>
          </div>
        ) : (
          <Spinner label={t("host.connecting")} />
        )}
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

  const flash = (r: "shared" | "copied" | "failed") =>
    setInfo(
      r === "copied"
        ? t("host.linkCopied")
        : r === "failed"
          ? t("host.shareUnavailable")
          : null,
    );
  const invite = () =>
    shareOrCopy({
      title: "Mister Qowa",
      text: t("host.inviteText"),
      url: joinUrl,
    }).then(flash);
  const shareResult = () => {
    const top = leaderboard
      .slice(0, 3)
      .map((e, i) => `${i + 1}. ${e.pseudo} (${e.total})`)
      .join("\n");
    return shareOrCopy({
      title: t("host.resultTitle"),
      text: `🏆 ${t("host.resultTitle")}\n${top}`,
    }).then(flash);
  };

  return (
    <Screen>
      <FloatingReactions items={reactions} />
      <ConnectionBanner />
      {error ? (
        <p className="mb-4 rounded-xl bg-rose-500/20 px-4 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="mb-4 rounded-xl bg-white/10 px-4 py-2 text-center text-sm text-white/80">
          {info}
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
            {t("host.playersConnected", { n: playerCount })}
          </p>
          <div className="flex max-h-40 flex-wrap justify-center gap-2 overflow-auto">
            {Object.entries(players).map(([puid, p]) => (
              <span
                key={puid}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 py-1 pl-3 pr-1 text-sm"
              >
                {p.avatar ? <span aria-hidden>{p.avatar}</span> : null}
                {p.pseudo}
                <button
                  type="button"
                  onClick={() => void kickPlayer(sessionId, puid)}
                  aria-label={t("host.kickAria", { pseudo: p.pseudo })}
                  className="rounded-full p-0.5 text-white/40 hover:bg-rose-500/30 hover:text-rose-200"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex w-full flex-col gap-2">
            {pin ? (
              <Button full variant="ghost" onClick={() => void invite()}>
                <Share2 className="size-4" /> {t("host.invite")}
              </Button>
            ) : null}
            <Button
              full
              disabled={busy || playerCount === 0 || !quiz}
              onClick={() =>
                quiz && act(() => nextQuestion(sessionId, quiz, 0))
              }
            >
              {t("host.start")}
            </Button>
          </div>
        </div>
      ) : null}

      {state === "QUESTION_ACTIVE" && current ? (
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex items-center justify-between text-white/60">
            <span>
              {t("common.questionN", {
                n: current.index + 1,
                total: current.total,
              })}
            </span>
            {paused ? (
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-3 py-1 font-display text-amber-200">
                <Pause className="size-4" /> {t("host.pause")}
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
          <h2 className="font-display text-2xl">{current.prompt}</h2>
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
            {t("host.answered", { count: stats.count, total: playerCount })}
            {eliminationMode ? t("host.inPlaySuffix", { n: survivors }) : ""}
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button
                full
                variant="ghost"
                disabled={busy}
                onClick={() => act(() => pauseQuestion(sessionId, !paused))}
              >
                {paused ? (
                  <>
                    <Play className="size-4" /> {t("host.resume")}
                  </>
                ) : (
                  <>
                    <Pause className="size-4" /> {t("host.pause")}
                  </>
                )}
              </Button>
              <Button
                full
                variant="ghost"
                disabled={busy || !quiz}
                onClick={() =>
                  quiz &&
                  act(() => replayQuestion(sessionId, quiz, current.index))
                }
              >
                <RotateCcw className="size-4" /> {t("host.replay")}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                full
                variant="ghost"
                disabled={busy || !quiz}
                onClick={() =>
                  quiz &&
                  act(() => skipQuestion(sessionId, quiz, current.index))
                }
              >
                <SkipForward className="size-4" /> {t("host.skip")}
              </Button>
              <Button
                full
                variant="danger"
                disabled={busy || !quiz}
                onClick={() =>
                  quiz &&
                  act(() => closeQuestion(sessionId, quiz, current.index))
                }
              >
                {t("host.closeNow")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {state === "LEADERBOARD" ? (
        <div className="flex flex-1 flex-col gap-6">
          <h2 className="text-center font-display text-2xl">
            {t("host.leaderboardTitle")}
          </h2>
          {teamStandings.length ? (
            <TeamLeaderboard standings={teamStandings} />
          ) : null}
          {current?.options ? (
            <AnswerDistribution
              options={current.options}
              byChoice={stats.byChoice}
              total={stats.count}
              correctId={correctId}
            />
          ) : null}
          {eliminationMode ? (
            <p className="text-center text-white/70">
              {t("host.survivorsLine", { n: survivors })}
            </p>
          ) : null}
          <Leaderboard entries={leaderboard} />
          <div className="mt-auto flex flex-col gap-2">
            {!isLast && !(eliminationMode && survivors <= 1) ? (
              <Button
                full
                disabled={busy || !quiz || !current}
                onClick={() =>
                  quiz &&
                  current &&
                  act(() => nextQuestion(sessionId, quiz, current.index + 1))
                }
              >
                {t("host.nextQuestion")}
              </Button>
            ) : null}
            <Button
              full
              variant={isLast ? "primary" : "ghost"}
              disabled={busy}
              onClick={() => act(() => endGame(sessionId, quiz ?? undefined))}
            >
              {t("host.endPodium")}
            </Button>
          </div>
        </div>
      ) : null}

      {state === "PODIUM" ? (
        <div className="flex flex-1 flex-col justify-center gap-8">
          <h2 className="text-center font-display text-3xl">
            {t("host.podiumTitle")}
          </h2>
          {teamStandings.length ? (
            <TeamLeaderboard standings={teamStandings} />
          ) : null}
          <Podium entries={leaderboard} />
          <div className="flex flex-col gap-2">
            <Button
              full
              disabled={busy || !quiz}
              onClick={() => quiz && act(() => restartSession(sessionId, quiz))}
            >
              <RefreshCw className="size-4" /> {t("host.replayWithSame")}
            </Button>
            <Button full variant="ghost" onClick={() => void shareResult()}>
              <Share2 className="size-4" /> {t("host.shareResult")}
            </Button>
            <Button
              full
              variant="ghost"
              onClick={() => {
                // Libère la salle (session + PIN) — best-effort, sans bloquer la sortie.
                closeSession(sessionId, pin).catch(() => undefined);
                reset();
                nav("/");
              }}
            >
              {t("host.newGame")}
            </Button>
          </div>
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
