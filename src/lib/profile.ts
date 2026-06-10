/**
 * Profil joueur LOCAL (cosmétique, non vérifié, effaçable) : identité mémorisée
 * + progression cumulée. Logique PURE et testée — la persistance vit dans
 * profileStore. Périmètre : parties multijoueur (le solo n'est pas comptabilisé).
 */

export interface Profile {
  pseudo: string;
  avatar: string;
  gamesPlayed: number;
  totalPoints: number;
  /** Meilleur rang atteint (1-based ; 1 = victoire). null si aucune partie. */
  bestRank: number | null;
  /** Ids de badges débloqués (libellés en i18n profile.badge.*). */
  badges: string[];
  /** sessionId déjà comptabilisées (anti double-comptage au PODIUM). Bornée. */
  counted: string[];
}

export const emptyProfile = (): Profile => ({
  pseudo: "",
  avatar: "",
  gamesPlayed: 0,
  totalPoints: 0,
  bestRank: null,
  badges: [],
  counted: [],
});

export interface GameResult {
  sessionId: string;
  /** Rang final 1-based (1 = 1er). */
  rank: number;
  points: number;
}

/** Badges débloquables (ids stables ; libellés traduits côté i18n). */
export const BADGES = {
  firstGame: "firstGame",
  podium: "podium",
  win: "win",
  veteran: "veteran",
} as const;

export const BADGE_EMOJI: Record<string, string> = {
  firstGame: "🎮",
  podium: "🏅",
  win: "🏆",
  veteran: "🎖️",
};

const MAX_COUNTED = 50;

/**
 * Applique un résultat de partie au profil. IDEMPOTENT par sessionId : un
 * second appel pour la même partie (re-render / StrictMode au PODIUM) est ignoré.
 */
export function applyGameResult(profile: Profile, r: GameResult): Profile {
  if (profile.counted.includes(r.sessionId)) return profile;
  const gamesPlayed = profile.gamesPlayed + 1;
  const totalPoints = profile.totalPoints + Math.max(0, Math.round(r.points));
  const bestRank =
    profile.bestRank === null ? r.rank : Math.min(profile.bestRank, r.rank);
  const badges = new Set(profile.badges);
  badges.add(BADGES.firstGame);
  if (r.rank <= 3) badges.add(BADGES.podium);
  if (r.rank === 1) badges.add(BADGES.win);
  if (gamesPlayed >= 5) badges.add(BADGES.veteran);
  return {
    ...profile,
    gamesPlayed,
    totalPoints,
    bestRank,
    badges: [...badges],
    // Borne la liste de dédup aux dernières parties (évite la croissance infinie).
    counted: [...profile.counted, r.sessionId].slice(-MAX_COUNTED),
  };
}
