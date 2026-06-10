/**
 * Abonnements RTDB ÉTROITS (D12) : le joueur n'écoute que `state`, `current`,
 * son score, son reveal et le top du leaderboard — JAMAIS l'arbre complet
 * (`players` à 1000 entrées). L'arbre joueurs est réservé au host.
 */
import { useEffect, useState } from "react";
import { onValue, onChildAdded, onChildChanged, ref } from "firebase/database";
import { getDb } from "../firebase/app";
import {
  statePath,
  currentPath,
  scorePath,
  scoresPath,
  leaderboardPath,
  playersPath,
  playerRevealPath,
  revealPath,
  metaPath,
  answersQuestionPath,
  reactionsPath,
  teamLeaderboardPath,
} from "@shared/paths";
import type { GameState } from "@shared/gameState";
import type { TeamStanding } from "@shared/teams";
import type {
  PublicQuestion,
  Score,
  LeaderboardEntry,
  Player,
  PlayerReveal,
} from "@shared/contracts";

function useRtdbValue<T>(path: string | null): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined);
  useEffect(() => {
    if (!path) {
      setValue(undefined);
      return;
    }
    const off = onValue(
      ref(getDb(), path),
      (snap) => {
        setValue((snap.val() ?? undefined) as T | undefined);
      },
      (err) => {
        // Permission/réseau : on ne fige plus silencieusement, on trace.
        console.error(`[RTDB] abonnement « ${path} » échoué`, err);
      },
    );
    return () => off();
  }, [path]);
  return value;
}

function asArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v.filter(Boolean) as T[];
  if (v && typeof v === "object") return Object.values(v as Record<string, T>);
  return [];
}

export interface PlayerView {
  state: GameState | undefined;
  current: PublicQuestion | undefined;
  score: Score | undefined;
  reveal: PlayerReveal | undefined;
  /** Bonne réponse publiée (choix gagnant) — lisible après clôture. */
  correctChoice: string | undefined;
  /** Explication de la bonne réponse (publiée à la clôture si présente). */
  explanation: string | undefined;
  /** Le joueur a-t-il été exclu par le host ? */
  kicked: boolean;
  /** Question en pause (réponses bloquées côté serveur). */
  paused: boolean;
  leaderboard: LeaderboardEntry[];
}

export function usePlayerView(
  sessionId: string | null,
  uid: string | null,
): PlayerView {
  const state = useRtdbValue<GameState>(
    sessionId ? statePath(sessionId) : null,
  );
  const current = useRtdbValue<PublicQuestion>(
    sessionId ? currentPath(sessionId) : null,
  );
  const score = useRtdbValue<Score>(
    sessionId && uid ? scorePath(sessionId, uid) : null,
  );
  const leaderboardRaw = useRtdbValue<unknown>(
    sessionId ? leaderboardPath(sessionId) : null,
  );
  const reveal = useRtdbValue<PlayerReveal>(
    sessionId && uid && current
      ? playerRevealPath(sessionId, current.questionId, uid)
      : null,
  );
  const correctChoice = useRtdbValue<string>(
    sessionId && current
      ? `${revealPath(sessionId, current.questionId)}/correct`
      : null,
  );
  const explanation = useRtdbValue<string>(
    sessionId && current
      ? `${revealPath(sessionId, current.questionId)}/explanation`
      : null,
  );
  const kicked = useRtdbValue<boolean>(
    sessionId && uid ? `${metaPath(sessionId)}/banned/${uid}` : null,
  );
  const paused = useRtdbValue<boolean>(
    sessionId ? `${metaPath(sessionId)}/paused` : null,
  );
  return {
    state,
    current,
    score,
    reveal,
    correctChoice,
    explanation,
    kicked: kicked === true,
    paused: paused === true,
    leaderboard: asArray<LeaderboardEntry>(leaderboardRaw),
  };
}

export interface HostView {
  state: GameState | undefined;
  current: PublicQuestion | undefined;
  players: Record<string, Player>;
  playerCount: number;
  /** Scores live (host) — sert au mode élimination (survivants). */
  scores: Record<string, Score>;
  /** Question en pause. */
  paused: boolean;
  /** Partie en mode élimination. */
  eliminationMode: boolean;
  leaderboard: LeaderboardEntry[];
}

export function useHostView(sessionId: string | null): HostView {
  const state = useRtdbValue<GameState>(
    sessionId ? statePath(sessionId) : null,
  );
  const current = useRtdbValue<PublicQuestion>(
    sessionId ? currentPath(sessionId) : null,
  );
  const players = useRtdbValue<Record<string, Player>>(
    sessionId ? playersPath(sessionId) : null,
  );
  const scores = useRtdbValue<Record<string, Score>>(
    sessionId ? scoresPath(sessionId) : null,
  );
  const paused = useRtdbValue<boolean>(
    sessionId ? `${metaPath(sessionId)}/paused` : null,
  );
  const eliminationMode = useRtdbValue<boolean>(
    sessionId ? `${metaPath(sessionId)}/eliminationMode` : null,
  );
  const leaderboardRaw = useRtdbValue<unknown>(
    sessionId ? leaderboardPath(sessionId) : null,
  );
  return {
    state,
    current,
    players: players ?? {},
    playerCount: players ? Object.keys(players).length : 0,
    scores: scores ?? {},
    paused: paused === true,
    eliminationMode: eliminationMode === true,
    leaderboard: asArray<LeaderboardEntry>(leaderboardRaw),
  };
}

export interface AnswerStats {
  count: number;
  byChoice: Record<string, number>;
}

/** Stats de réponses de la question courante (HOST uniquement — lit /answers). */
export function useAnswerStats(
  sessionId: string | null,
  questionId: string | null,
): AnswerStats {
  const [stats, setStats] = useState<AnswerStats>({ count: 0, byChoice: {} });
  useEffect(() => {
    if (!sessionId || !questionId) {
      setStats({ count: 0, byChoice: {} });
      return;
    }
    const off = onValue(
      ref(getDb(), answersQuestionPath(sessionId, questionId)),
      (snap) => {
        const shards = (snap.val() ?? {}) as Record<
          string,
          Record<string, { choice: string }>
        >;
        const byChoice: Record<string, number> = {};
        const seen = new Set<string>();
        for (const shard of Object.values(shards)) {
          for (const [pid, a] of Object.entries(shard)) {
            if (seen.has(pid)) continue;
            seen.add(pid);
            byChoice[a.choice] = (byChoice[a.choice] ?? 0) + 1;
          }
        }
        setStats({ count: seen.size, byChoice });
      },
      (err) => console.error("[RTDB] stats de réponses échouées", err),
    );
    return () => off();
  }, [sessionId, questionId]);
  return stats;
}

/** Classement par équipe (mode équipe ; vide en mode individuel). */
export function useTeamLeaderboard(sessionId: string | null): TeamStanding[] {
  const raw = useRtdbValue<unknown>(
    sessionId ? teamLeaderboardPath(sessionId) : null,
  );
  return asArray<TeamStanding>(raw);
}

/** Flux de réactions emoji éphémères (live). */
export function useReactions(
  sessionId: string | null,
): { id: number; emoji: string }[] {
  const [items, setItems] = useState<{ id: number; emoji: string }[]>([]);
  useEffect(() => {
    if (!sessionId) {
      setItems([]);
      return;
    }
    let counter = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    // 1 nœud par joueur : un nouvel envoi est un onChildAdded (1re fois) OU un
    // onChildChanged (ré-réaction, le nœud existe déjà) → on anime les deux.
    const float = (snap: { val: () => unknown }) => {
      const v = snap.val() as { emoji?: string; ts?: number } | null;
      if (!v?.emoji) return;
      if (v.ts && Date.now() - v.ts > 6000) return; // ignore les anciennes au montage
      const id = ++counter;
      setItems((cur) => [...cur, { id, emoji: v.emoji as string }]);
      timers.push(
        setTimeout(
          () => setItems((cur) => cur.filter((x) => x.id !== id)),
          3500,
        ),
      );
    };
    const node = ref(getDb(), reactionsPath(sessionId));
    const offAdd = onChildAdded(node, float);
    const offChange = onChildChanged(node, float);
    return () => {
      offAdd();
      offChange();
      timers.forEach(clearTimeout);
    };
  }, [sessionId]);
  return items;
}
