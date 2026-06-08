import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Trophy } from "lucide-react";
import { Screen, Card, Button, Spinner } from "../lib/ui";
import {
  fetchMyResults,
  resultsCsv,
  downloadCsv,
  type GameResult,
} from "../lib/results";
import { errMsg } from "../lib/err";

export function History() {
  const nav = useNavigate();
  const [results, setResults] = useState<GameResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchMyResults()
      .then((r) => alive && setResults(r))
      .catch((e) => {
        if (alive) {
          setError(errMsg(e));
          setResults([]);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <Screen>
      <button
        type="button"
        onClick={() => nav("/")}
        className="mb-4 inline-flex items-center gap-1 self-start text-sm text-white/60 hover:text-white"
      >
        <ArrowLeft className="size-4" /> Accueil
      </button>
      <h1 className="font-display text-3xl">Mes parties</h1>

      {error ? (
        <p className="mt-4 rounded-xl bg-rose-500/20 px-4 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {results === null ? (
        <Spinner label="Chargement de l’historique…" />
      ) : results.length === 0 ? (
        <p className="mt-8 text-center text-white/60">
          Aucune partie terminée pour l’instant. Lance un quiz et termine-le
          pour le voir ici !
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {results.map((r) => (
            <Card key={r.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{r.quizTitle}</p>
                  <p className="text-sm text-white/60">
                    {new Date(r.finishedAt).toLocaleString("fr-FR")} ·{" "}
                    {r.playerCount} joueur{r.playerCount > 1 ? "s" : ""}
                  </p>
                  {r.ranking[0] ? (
                    <p className="mt-1 inline-flex items-center gap-1 text-sm text-answer-yellow">
                      <Trophy className="size-4" /> {r.ranking[0].pseudo} ·{" "}
                      {r.ranking[0].total} pts
                    </p>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  onClick={() =>
                    downloadCsv(
                      `${r.quizTitle.replace(/[^\w.-]+/g, "_")}.csv`,
                      resultsCsv(r),
                    )
                  }
                >
                  <Download className="size-4" /> CSV
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Screen>
  );
}
