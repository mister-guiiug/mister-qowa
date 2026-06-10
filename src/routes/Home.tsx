import { useNavigate } from "react-router-dom";
import { Zap, Users, Gamepad2, History, Play } from "lucide-react";
import { Screen, Button } from "../lib/ui";
import { AppFooter } from "../components/AppFooter";
import { useGameStore } from "../store/gameStore";
import { useProfile } from "../store/profileStore";
import { BADGE_EMOJI } from "../lib/profile";
import { useT } from "../i18n";

export function Home() {
  const t = useT();
  const nav = useNavigate();
  const role = useGameStore((s) => s.role);
  const sessionId = useGameStore((s) => s.sessionId);
  const reset = useGameStore((s) => s.reset);
  const profile = useProfile((s) => s.profile);
  const resumePath =
    role && sessionId
      ? role === "host"
        ? `/host/${sessionId}`
        : `/play/${sessionId}`
      : null;

  return (
    <Screen className="justify-center text-center">
      <h1 className="font-display text-5xl text-brand-soft">Mister Qowa</h1>
      <p className="mt-3 text-balance text-white/70">{t("home.subtitle")}</p>

      {profile.gamesPlayed > 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
          <p className="text-sm text-white/80">
            {profile.avatar ? <span aria-hidden>{profile.avatar} </span> : null}
            <span className="font-semibold">{profile.pseudo}</span>
            {" · "}
            {t("profile.summary", {
              games: profile.gamesPlayed,
              points: profile.totalPoints,
            })}
          </p>
          {profile.badges.length ? (
            <div className="flex flex-wrap justify-center gap-1.5">
              {profile.badges.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs"
                >
                  <span aria-hidden>{BADGE_EMOJI[b] ?? "⭐"}</span>
                  {t(`profile.badge.${b}` as "profile.badge.firstGame")}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {resumePath ? (
        <div className="mt-8 flex flex-col items-center gap-1">
          <Button full onClick={() => nav(resumePath)}>
            <Play className="size-5" /> {t("home.resume")}
          </Button>
          <button
            type="button"
            onClick={reset}
            className="text-xs text-white/40 hover:text-white/70"
          >
            {t("home.quit")}
          </button>
        </div>
      ) : null}

      <div className="mt-10 flex flex-col gap-3">
        <Button full onClick={() => nav("/create")}>
          <Zap className="size-5" /> {t("home.host")}
        </Button>
        <Button full variant="ghost" onClick={() => nav("/join")}>
          <Users className="size-5" /> {t("home.join")}
        </Button>
        <Button full variant="ghost" onClick={() => nav("/solo")}>
          <Gamepad2 className="size-5" /> {t("home.solo")}
        </Button>
      </div>
      <button
        type="button"
        onClick={() => nav("/history")}
        className="mt-4 inline-flex items-center justify-center gap-1.5 text-sm text-white/50 hover:text-white"
      >
        <History className="size-4" /> {t("home.myGames")}
      </button>
      <AppFooter />
    </Screen>
  );
}
