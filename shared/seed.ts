/** Quiz de démonstration (types MVP : choix multiple + vrai/faux). */
import type { Quiz } from "./contracts";
import { DEFAULT_BASE_POINTS, DEFAULT_TIME_LIMIT_MS } from "./gameState";

const T = DEFAULT_TIME_LIMIT_MS;
const P = DEFAULT_BASE_POINTS;

export const DEMO_QUIZ: Quiz = {
  id: "demo-culture-g",
  title: "Culture générale express",
  description: "5 questions pour essayer le moteur live de Mister Qowa.",
  questions: [
    {
      id: "q1",
      type: "multiple_choice",
      prompt: "Quelle est la capitale de l’Australie ?",
      timeLimitMs: T,
      basePoints: P,
      options: [
        { id: "a", label: "Sydney" },
        { id: "b", label: "Canberra" },
        { id: "c", label: "Melbourne" },
        { id: "d", label: "Perth" },
      ],
      correctOptionId: "b",
    },
    {
      id: "q2",
      type: "true_false",
      prompt: "Le Soleil est une étoile.",
      timeLimitMs: 15_000,
      basePoints: P,
      correct: true,
    },
    {
      id: "q3",
      type: "multiple_choice",
      prompt: "Combien de côtés a un hexagone ?",
      timeLimitMs: T,
      basePoints: P,
      options: [
        { id: "a", label: "5" },
        { id: "b", label: "6" },
        { id: "c", label: "7" },
        { id: "d", label: "8" },
      ],
      correctOptionId: "b",
    },
    {
      id: "q4",
      type: "true_false",
      prompt:
        "La Grande Muraille de Chine est visible à l’œil nu depuis la Lune.",
      timeLimitMs: 15_000,
      basePoints: P,
      correct: false,
    },
    {
      id: "q5",
      type: "multiple_choice",
      prompt: "Quel langage s’exécute nativement dans le navigateur ?",
      timeLimitMs: T,
      basePoints: P,
      options: [
        { id: "a", label: "Python" },
        { id: "b", label: "JavaScript" },
        { id: "c", label: "C++" },
        { id: "d", label: "Rust" },
      ],
      correctOptionId: "b",
    },
  ],
};

export const DEMO_QUIZZES: Quiz[] = [DEMO_QUIZ];
