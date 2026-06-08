/**
 * Abonnements RTDB ÉTROITS (D12) : le joueur n'écoute que `state`, `current`,
 * son score, son reveal et le top du leaderboard — JAMAIS l'arbre complet
 * (`players` à 1000 entrées). L'arbre joueurs est réservé au host.
 */
import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { getDb } from "../firebase/app";
import {
  statePath,
  currentPath,
  scorePath,
  leaderboardPath,
  playersPath,
  playerRevealPath,
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
