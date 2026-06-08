/**
 * Abonnements RTDB ÉTROITS (D12) : le joueur n'écoute que `state`, `current`,
 * son score, son reveal et le top du leaderboard — JAMAIS l'arbre complet
 * (`players` à 1000 entrées). L'arbre joueurs est réservé au host.
 */
import { useEffect, useState } from "react";
import {
  onValue,
  onChildAdded,
  query,
  limitToLast,
  ref,
} from "firebase/database";
import { getDb } from "../firebase/app";
import {
  statePath,
  currentPath,
  scorePath,
  leaderboardPath,
  playersPath,
  playerRevealPath,
  answersQuestionPath,
  reactionsPath,
} from "@shared/paths";
import type { GameState } from "@shared/gameState";
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
    const off = onValue(ref(getDb(), path), (snap) => {
      setValue((snap.val() ?? undefined) as T | undefined);
    });
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
  return {
    state,
    current,
    score,
    reveal,
    leaderboard: asArray<LeaderboardEntry>(leaderboardRaw),
  };
}

export interface HostView {
  state: GameState | undefined;
  current: PublicQuestion | undefined;
  players: Record<string, Player>;
  playerCount: number;
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
  const leaderboardRaw = useRtdbValue<unknown>(
    sessionId ? leaderboardPath(sessionId) : null,
  );
  return {
    state,
    current,
    players: players ?? {},
    playerCount: players ? Object.keys(players).length : 0,
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
    );
    return () => off();
  }, [sessionId, questionId]);
  return stats;
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
    const off = onChildAdded(
      query(ref(getDb(), reactionsPath(sessionId)), limitToLast(6)),
      (snap) => {
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
      },
    );
    return () => {
      off();
      timers.forEach(clearTimeout);
    };
  }, [sessionId]);
  return items;
}
