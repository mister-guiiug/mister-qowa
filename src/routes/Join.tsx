import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Screen, Button } from "../lib/ui";
import { lookupSession, joinSession } from "../firebase/api";
import { useGameStore } from "../store/gameStore";
import { useProfile } from "../store/profileStore";
import { PIN_LENGTH, MAX_PSEUDO_LEN } from "@shared/gameState";
import { AVATARS } from "@shared/avatars";
import type { Team } from "@shared/teams";
import { useErr, useT } from "../i18n";

export function Join() {
  const t = useT();
  const err = useErr();
  const nav = useNavigate();
  const setPlayer = useGameStore((s) => s.setPlayer);
  const profile = useProfile((s) => s.profile);
  const setIdentity = useProfile((s) => s.setIdentity);
  const [searchParams] = useSearchParams();
  const [pin, setPin] = useState(() =>
    (searchParams.get("pin") ?? "").replace(/\D/g, "").slice(0, PIN_LENGTH),
  );
  // Pré-remplissage depuis le profil local (rejoindre en 1 tap au retour).
  const [pseudo, setPseudo] = useState(profile.pseudo);
  const [avatar, setAvatar] = useState<string>(profile.avatar || AVATARS[0]);
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = pin.length === PIN_LENGTH && pseudo.trim().length > 0;

  async function go(teamId?: string) {
    setBusy(true);
    setError(null);
    try {
      const { sessionId } = await joinSession(
        pin,
        pseudo.trim(),
        teamId,
        avatar,
      );
      setPlayer({ sessionId, pin, pseudo: pseudo.trim() });
      setIdentity(pseudo.trim(), avatar); // mémorise pour la prochaine fois
      nav(`/play/${sessionId}`);
    } catch (e) {
      setError(err(e));
      setBusy(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      const { teams: t } = await lookupSession(pin);
      if (t && t.length) {
        setTeams(t);
        setBusy(false);
      } else {
        await go();
      }
    } catch (e2) {
      setError(err(e2));
      setBusy(false);
    }
  }

  return (
    <Screen>
      <button
        type="button"
        onClick={() => (teams ? setTeams(null) : nav("/"))}
        className="mb-4 inline-flex items-center gap-1 self-start text-sm text-white/60 hover:text-white"
      >
        <ArrowLeft className="size-4" />{" "}
        {teams ? t("common.back") : t("common.home")}
      </button>
      <h1 className="font-display text-3xl">{t("join.title")}</h1>

      {teams ? (
        <div className="mt-6 flex flex-col gap-3">
          <p className="text-white/60">{t("join.pickTeam", { pseudo })}</p>
          {teams.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={busy}
              onClick={() => void go(t.id)}
              className="rounded-2xl px-4 py-3 text-left text-lg font-bold text-white shadow-lg transition active:scale-[.98] disabled:opacity-60"
              style={{ background: t.color }}
            >
              {t.name}
            </button>
          ))}
          {error ? (
            <p className="rounded-xl bg-rose-500/20 px-4 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-white/60">{t("join.pinLabel")}</span>
            {/* Un seul input réel (transparent, au-dessus) pilote 8 cases visuelles :
                préserve collage, autofill et lecteurs d'écran. */}
            <div className="relative">
              <input
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH))
                }
                aria-label={t("join.pinAria", {
                  n: pin.length,
                  total: PIN_LENGTH,
                })}
                className="absolute inset-0 z-10 w-full cursor-pointer text-transparent caret-transparent opacity-0"
              />
              <div aria-hidden className="flex justify-between gap-1.5">
                {Array.from({ length: PIN_LENGTH }, (_, i) => (
                  <div
                    key={i}
                    className={`flex h-12 flex-1 items-center justify-center rounded-xl font-display text-xl tabular-nums ring-1 transition ${
                      pin.length === PIN_LENGTH
                        ? "bg-answer-green/15 ring-answer-green"
                        : i < pin.length
                          ? "bg-white/10 ring-brand"
                          : "bg-white/5 ring-white/15"
                    }`}
                  >
                    {pin[i] ?? ""}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-white/60">
              {t("join.pseudoLabel")}
            </span>
            <input
              value={pseudo}
              maxLength={MAX_PSEUDO_LEN}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder={t("join.pseudoPlaceholder")}
              className="rounded-2xl bg-white/10 px-4 py-3 text-lg outline-none ring-1 ring-white/15 focus:ring-brand"
            />
          </label>

          <div className="flex flex-col gap-1">
            <span className="text-sm text-white/60">
              {t("join.avatarLabel")}
            </span>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  aria-pressed={avatar === a}
                  aria-label={t("join.avatarAria", { a })}
                  className={`flex size-10 items-center justify-center rounded-xl text-xl ring-1 transition ${
                    avatar === a
                      ? "bg-brand/30 ring-brand"
                      : "bg-white/5 ring-white/15 hover:bg-white/10"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <p className="rounded-xl bg-rose-500/20 px-4 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <Button type="submit" full disabled={!ready || busy}>
            {busy ? t("common.connecting") : t("join.submit")}
          </Button>
        </form>
      )}
    </Screen>
  );
}
