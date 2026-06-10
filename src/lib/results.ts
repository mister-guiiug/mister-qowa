/** Lecture de l'historique des parties (Firestore lazy) + export CSV. */

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

const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;

export function resultsCsv(r: GameResult): string {
  const header = "rang,pseudo,avatar,score";
  const lines = r.ranking.map(
    (row, i) =>
      `${i + 1},${csvCell(row.pseudo)},${csvCell(row.avatar ?? "")},${row.total}`,
  );
  // Bloc optionnel : taux de réussite par question.
  const stats = r.questionStats ?? [];
  const statLines = stats.length
    ? [
        "",
        "question,enonce,reussite",
        ...stats.map(
          (q) =>
            `${q.index + 1},${csvCell(q.prompt)},${
              q.answered ? Math.round((100 * q.correct) / q.answered) : 0
            }%`,
        ),
      ]
    : [];
  return [header, ...lines, ...statLines].join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
