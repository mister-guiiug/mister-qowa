/** Lecture de l'historique des parties (Firestore lazy) + export CSV. */
import { toCsv } from "@mister-guiiug/dev-wpa-config/csv";

export interface RankRow {
  uid: string;
  pseudo: string;
  total: number;
  avatar?: string;
}

/** Statistiques d'une question (archivées pour l'écran d'insights). */
export interface QuestionStat {
  index: number;
  prompt: string;
  answered: number;
  correct: number;
}

export interface GameResult {
  id: string;
  sessionId: string;
  hostUid: string;
  quizId: string | null;
  quizTitle: string;
  finishedAt: number;
  playerCount: number;
  ranking: RankRow[];
  questionStats?: QuestionStat[];
}

/** Agrégat d'un quiz à travers toutes les parties archivées. */
export interface QuizAggregate {
  quizId: string;
  quizTitle: string;
  games: number;
  /** Moyenne des scores de TOUS les joueurs, toutes parties confondues. */
  avgScore: number;
  bestScore: number;
}

export function aggregateByQuiz(results: GameResult[]): QuizAggregate[] {
  const byQuiz = new Map<
    string,
    { title: string; games: number; sum: number; n: number; best: number }
  >();
  for (const r of results) {
    const key = r.quizId ?? r.quizTitle;
    const agg = byQuiz.get(key) ?? {
      title: r.quizTitle,
      games: 0,
      sum: 0,
      n: 0,
      best: 0,
    };
    agg.games += 1;
    for (const row of r.ranking) {
      agg.sum += row.total;
      agg.n += 1;
      agg.best = Math.max(agg.best, row.total);
    }
    byQuiz.set(key, agg);
  }
  return [...byQuiz.entries()]
    .map(([quizId, a]) => ({
      quizId,
      quizTitle: a.title,
      games: a.games,
      avgScore: a.n ? Math.round(a.sum / a.n) : 0,
      bestScore: a.best,
    }))
    .sort((a, b) => b.games - a.games);
}

/** Question la plus ratée (plus faible taux de réussite, au moins 1 réponse). */
export function hardestQuestion(r: GameResult): QuestionStat | null {
  const stats = (r.questionStats ?? []).filter((q) => q.answered > 0);
  if (stats.length === 0) return null;
  return stats.reduce((worst, q) =>
    q.correct / q.answered < worst.correct / worst.answered ? q : worst,
  );
}

export async function fetchMyResults(): Promise<GameResult[]> {
  // Firestore importé à la demande : ne pèse pas sur le démarrage de l'app.
  const { fetchResults } = await import("../firebase/fs");
  const rows = await fetchResults<Omit<GameResult, "id">>();
  return rows.sort((a, b) => b.finishedAt - a.finishedAt);
}

// Dialecte `unix` : virgule + `\n` sans BOM, comme l'export historique de
// l'app. Seule différence avec l'ancien `csvCell` maison : les guillemets ne
// sont posés que là où RFC 4180 l'exige (contenu des cellules inchangé).
const CSV = { dialect: "unix" } as const;

export function resultsCsv(r: GameResult): string {
  const ranking = toCsv(
    r.ranking.map((row, i) => ({
      rang: i + 1,
      pseudo: row.pseudo,
      avatar: row.avatar ?? "",
      score: row.total,
    })),
    { ...CSV, columns: ["rang", "pseudo", "avatar", "score"] },
  );
  // Bloc optionnel : taux de réussite par question.
  const stats = r.questionStats ?? [];
  if (stats.length === 0) return ranking;
  const statBlock = toCsv(
    stats.map((q) => ({
      question: q.index + 1,
      enonce: q.prompt,
      reussite: `${q.answered ? Math.round((100 * q.correct) / q.answered) : 0}%`,
    })),
    { ...CSV, columns: ["question", "enonce", "reussite"] },
  );
  return [ranking, "", statBlock].join("\n");
}
