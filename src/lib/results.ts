/** Lecture de l'historique des parties (Firestore) + export CSV. */
import { collection, getDocs, query, where } from "firebase/firestore";
import { getFs, ensureAuth } from "../firebase/app";

export interface RankRow {
  uid: string;
  pseudo: string;
  total: number;
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

export function resultsCsv(r: GameResult): string {
  const header = "rang,pseudo,score";
  const lines = r.ranking.map(
    (row, i) => `${i + 1},"${row.pseudo.replace(/"/g, '""')}",${row.total}`,
  );
  return [header, ...lines].join("\n");
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
