/** Lecture de l'historique des parties (Firestore) + export CSV. */
import { collection, getDocs, query, where } from "firebase/firestore";
import { getFs, ensureAuth } from "../firebase/app";

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

/** Question la plus ratée (plus faible taux de réussite, au moins 1 réponse). */
export function hardestQuestion(r: GameResult): QuestionStat | null {
  const stats = (r.questionStats ?? []).filter((q) => q.answered > 0);
  if (stats.length === 0) return null;
  return stats.reduce((worst, q) =>
    q.correct / q.answered < worst.correct / worst.answered ? q : worst,
  );
}

export async function fetchMyResults(): Promise<GameResult[]> {
  const user = await ensureAuth();
  const snap = await getDocs(
    query(collection(getFs(), "results"), where("hostUid", "==", user.uid)),
  );
  const rows: GameResult[] = [];
  snap.forEach((d) =>
    rows.push({ id: d.id, ...(d.data() as Omit<GameResult, "id">) }),
  );
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
