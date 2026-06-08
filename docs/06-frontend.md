## 6. Code exemple — Frontend

### 6.1 Arborescence `src/` proposée

Calquée sur la structure réelle du parc (`mister-puzzle` / `miss-genius`) : un module `firebase.ts` racine, des `hooks/` d'abonnement temps réel, un `store/` Zustand, et un cœur métier pur (`engine/`) isolé et testable hors React.

```text
src/
├── App.tsx
├── main.tsx
├── firebase.ts                    # initializeApp + getDatabase/getFirestore/getAuth
├── config/
│   └── firebaseEnv.ts             # validation des VITE_FIREBASE_* (comme le parc)
├── shared/
│   └── schemas/
│       ├── game.ts                # zod : GameState, Player, Answer, machine à états
│       ├── question.ts            # zod : Question (QCM, V/F, libre, sondage)
│       └── index.ts
├── engine/
│   ├── scoring.ts                 # MOTEUR DE SCORING — module pur, zéro dépendance React/Firebase
│   ├── scoring.test.ts            # test Vitest
│   └── normalizeFreeText.ts       # normalisation réponse libre (réutilisé client + Functions)
├── store/
│   └── useGameStore.ts            # store Zustand de session (rôle, pin, état UI local)
├── hooks/
│   ├── useGameSession.ts          # abonnement RTDB temps réel à games/{pin}
│   ├── usePlayerPresence.ts       # onDisconnect / présence joueur
│   └── useServerNow.ts            # offset horloge serveur (sync countdown)
├── features/
│   ├── host/                      # écrans Host (création, pilotage)
│   ├── player/                    # écrans Player (join, répondre)
│   └── bigscreen/                 # affichage partagé (lecture seule)
├── components/
│   ├── AnswerGrid.tsx             # grille de réponse 1-clic (framer-motion)
│   ├── Leaderboard.tsx            # classement animé (layout/reorder)
│   └── Countdown.tsx              # compte à rebours synchronisé serveur
├── links.ts                       # REPO_URL + SPONSOR_URL (convention parc)
├── index.css
└── vite-env.d.ts
```

### 6.2 Schémas zod partagés (`shared/schemas/`)

Les schémas sont la frontière de confiance : **réutilisés à l'identique côté client (validation des inputs) et côté Cloud Functions** (re-validation avant écriture autoritaire). zod v4.

```typescript
// src/shared/schemas/question.ts
import { z } from 'zod';

export const QuestionKind = z.enum(['mcq', 'truefalse', 'freetext', 'poll']);
export type QuestionKind = z.infer<typeof QuestionKind>;

const optionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(120),
  /** Absent/null pour les sondages (aucune bonne réponse). */
  correct: z.boolean().optional(),
});

export const questionSchema = z
  .object({
    id: z.string().min(1),
    kind: QuestionKind,
    prompt: z.string().min(1).max(300),
    /** 2 à 4 options pour un QCM ; ignoré pour freetext. */
    options: z.array(optionSchema).min(2).max(4).optional(),
    /** Réponses acceptées (normalisées) pour le type freetext. */
    acceptedAnswers: z.array(z.string().min(1)).max(10).optional(),
    timeLimitMs: z.int().min(5_000).max(120_000),
    basePoints: z.int().min(0).max(2000),
    mediaUrl: z.url().optional(), // Firebase Storage
  })
  .refine(q => q.kind !== 'freetext' || (q.acceptedAnswers?.length ?? 0) > 0, {
    message: 'Une question libre exige au moins une réponse acceptée.',
    path: ['acceptedAnswers'],
  });

export type Question = z.infer<typeof questionSchema>;
```

```typescript
// src/shared/schemas/game.ts
import { z } from 'zod';

/** Machine à états verrouillée de la partie. */
export const GamePhase = z.enum([
  'LOBBY',
  'QUESTION_COUNTDOWN',
  'QUESTION_ACTIVE',
  'QUESTION_REVEAL',
  'LEADERBOARD',
  'PODIUM',
  'ENDED',
]);
export type GamePhase = z.infer<typeof GamePhase>;

export const GameMode = z.enum(['live', 'async', 'team']);
export type GameMode = z.infer<typeof GameMode>;

export const playerSchema = z.object({
  uid: z.string().min(1),
  nickname: z.string().min(1).max(24),
  teamId: z.string().optional(),
  score: z.int().min(0).default(0),
  streak: z.int().min(0).default(0),
  joinedAt: z.int(),
});
export type Player = z.infer<typeof playerSchema>;

/** Réponse soumise par un joueur (input client → re-validé par la Function). */
export const submitAnswerSchema = z.object({
  pin: z.string().regex(/^\d{6}$/, 'PIN à 6 chiffres'),
  questionIndex: z.int().min(0),
  /** id d'option (QCM / V/F) OU texte brut (freetext). */
  answer: z.union([z.string().min(1).max(200), z.boolean()]),
  /** Horodatage client, recalé sur l'horloge serveur côté Function. */
  clientSentAt: z.int(),
});
export type SubmitAnswer = z.infer<typeof submitAnswerSchema>;

/** Vue live de la partie, telle que diffusée par RTDB sous games/{pin}. */
export const gameStateSchema = z.object({
  pin: z.string().regex(/^\d{6}$/),
  hostUid: z.string().min(1),
  phase: GamePhase,
  mode: GameMode,
  currentQuestionIndex: z.int().min(-1),
  totalQuestions: z.int().min(0),
  /** Échéances en temps serveur (ms epoch) pour synchroniser les countdowns. */
  phaseEndsAt: z.int().nullable(),
  players: z.record(z.string(), playerSchema).default({}),
  updatedAt: z.int(),
});
export type GameState = z.infer<typeof gameStateSchema>;
```

### 6.3 Moteur de scoring (module pur testable, `engine/scoring.ts`)

Pur, sans dépendance React ni Firebase : **importé tel quel par les Cloud Functions** (le client ne calcule jamais le score officiel ; il peut s'en servir pour une estimation d'affichage optimiste). Implémente exactement la formule verrouillée.

```typescript
// src/engine/scoring.ts

/** Bornes d'un round de scoring, dérivées d'une Question. */
export interface ScoringInput {
  correct: boolean;
  /** Délai de réponse mesuré côté serveur (ms). */
  responseTimeMs: number;
  /** Temps limite de la question (ms). */
  timeLimitMs: number;
  basePoints: number;
  /** Bonnes réponses consécutives AVANT celle-ci (pour le bonus de série). */
  currentStreak: number;
  /** +x % par bonne réponse consécutive. 0 = bonus désactivé. */
  streakBonusPct?: number;
  /** Le sondage ne rapporte jamais de point. */
  isPoll?: boolean;
}

export interface ScoringResult {
  /** Points officiels attribués (entier ≥ 0). */
  points: number;
  /** Nouvelle valeur de série après ce round. */
  nextStreak: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Scoring type Kahoot, FAISANT AUTORITÉ.
 * - faux / hors-temps / sondage => 0 point, série remise à 0.
 * - juste => round(basePoints * (1 - 0.5 * (responseTimeMs / timeLimitMs))),
 *   borné à [basePoints/2, basePoints], puis bonus de série appliqué.
 */
export function computeScore(input: ScoringInput): ScoringResult {
  const {
    correct,
    responseTimeMs,
    timeLimitMs,
    basePoints,
    currentStreak,
    streakBonusPct = 0,
    isPoll = false,
  } = input;

  const outOfTime = responseTimeMs > timeLimitMs || responseTimeMs < 0;
  if (isPoll || !correct || outOfTime) {
    return { points: 0, nextStreak: 0 };
  }

  // Fraction de temps écoulée, bornée [0,1] pour neutraliser tout jitter réseau.
  const elapsed = clamp(responseTimeMs / timeLimitMs, 0, 1);
  const speedScore = basePoints * (1 - 0.5 * elapsed);
  const bounded = clamp(speedScore, basePoints / 2, basePoints);

  const nextStreak = currentStreak + 1;
  // Bonus appliqué sur les séries ≥ 2 (la 1re bonne réponse ne bonifie pas).
  const multiplier = 1 + (streakBonusPct / 100) * Math.max(currentStreak, 0);

  return { points: Math.round(bounded * multiplier), nextStreak };
}
```

```typescript
// src/engine/scoring.test.ts
import { describe, it, expect } from 'vitest';
import { computeScore } from './scoring';

const base = {
  correct: true,
  timeLimitMs: 20_000,
  basePoints: 1000,
  currentStreak: 0,
} as const;

describe('computeScore', () => {
  it('réponse instantanée → points pleins (basePoints)', () => {
    const r = computeScore({ ...base, responseTimeMs: 0 });
    expect(r.points).toBe(1000);
    expect(r.nextStreak).toBe(1);
  });

  it('réponse à mi-temps → 75 % des points', () => {
    // 1000 * (1 - 0.5 * 0.5) = 750
    expect(computeScore({ ...base, responseTimeMs: 10_000 }).points).toBe(750);
  });

  it('réponse à la dernière ms → plancher basePoints/2', () => {
    expect(computeScore({ ...base, responseTimeMs: 20_000 }).points).toBe(500);
  });

  it('mauvaise réponse → 0 point et série remise à 0', () => {
    const r = computeScore({ ...base, correct: false, responseTimeMs: 1000, currentStreak: 3 });
    expect(r).toEqual({ points: 0, nextStreak: 0 });
  });

  it('hors-temps → 0 point même si correct', () => {
    expect(computeScore({ ...base, responseTimeMs: 25_000 }).points).toBe(0);
  });

  it('sondage → jamais de point', () => {
    expect(computeScore({ ...base, isPoll: true, responseTimeMs: 0 }).points).toBe(0);
  });

  it('bonus de série : +10 %/réponse, appliqué sur la série en cours', () => {
    // currentStreak=2 → multiplicateur 1 + 0.10*2 = 1.2 ; 1000 * 1.2 = 1200
    const r = computeScore({
      ...base,
      responseTimeMs: 0,
      currentStreak: 2,
      streakBonusPct: 10,
    });
    expect(r.points).toBe(1200);
    expect(r.nextStreak).toBe(3);
  });
});
```

### 6.4 Store Zustand de session (`store/useGameStore.ts`)

Le store détient **l'état local au client** (rôle, PIN saisi, sélection UI, soumission en cours) — la source de vérité de la partie reste RTDB, exposée par `useGameSession`. On respecte la règle du parc : **pas de `.filter`/`.map` dans un sélecteur** (sinon boucle `useSyncExternalStore` → page blanche) ; on sélectionne des champs scalaires.

```typescript
// src/store/useGameStore.ts
import { create } from 'zustand';

export type Role = 'host' | 'player' | 'bigscreen';

interface GameUIState {
  role: Role | null;
  pin: string | null;
  nickname: string;
  /** Index de l'option choisie pour la question courante (UI optimiste). */
  selectedAnswerId: string | null;
  /** Verrou anti double-soumission tant que la Function n'a pas répondu. */
  submitting: boolean;

  setRole: (role: Role) => void;
  joinAs: (pin: string, nickname: string) => void;
  /** Appelé à chaque QUESTION_ACTIVE pour repartir d'une UI vierge. */
  resetForQuestion: () => void;
  selectAnswer: (answerId: string) => void;
  setSubmitting: (submitting: boolean) => void;
  leave: () => void;
}

export const useGameStore = create<GameUIState>(set => ({
  role: null,
  pin: null,
  nickname: '',
  selectedAnswerId: null,
  submitting: false,

  setRole: role => set({ role }),
  joinAs: (pin, nickname) => set({ role: 'player', pin, nickname }),
  resetForQuestion: () => set({ selectedAnswerId: null, submitting: false }),
  selectAnswer: answerId => set({ selectedAnswerId: answerId }),
  setSubmitting: submitting => set({ submitting }),
  leave: () =>
    set({ role: null, pin: null, selectedAnswerId: null, submitting: false }),
}));

// Sélecteurs stables : champs scalaires uniquement (jamais de filter/map ici).
export const selectPin = (s: GameUIState) => s.pin;
export const selectIsHost = (s: GameUIState) => s.role === 'host';
export const selectHasAnswered = (s: GameUIState) =>
  s.selectedAnswerId !== null;
```

### 6.5 Hook `useGameSession` (abonnement RTDB temps réel)

Calqué sur `usePuzzle` réel (`ref` → `onValue` → cleanup `off`), mais durci par **validation zod du payload** : un état RTDB malformé est rejeté plutôt que de planter le rendu. Faible latence : RTDB pousse chaque mutation d'état (`phase`, `phaseEndsAt`, `players`) sous les 100 ms.

```typescript
// src/hooks/useGameSession.ts
import { useEffect, useState } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '../firebase';
import { gameStateSchema, type GameState } from '../shared/schemas/game';

interface SessionResult {
  game: GameState | null;
  loading: boolean;
  error: string | null;
}

/** Abonnement live à games/{pin}. `null` => partie inexistante/fermée. */
export function useGameSession(pin: string | null): SessionResult {
  const [game, setGame] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /* État synchronisé sur le cycle onValue/cleanup (cf. parc). */
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!pin) {
      setGame(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const gameRef = ref(db, `games/${pin}`);

    const unsubscribe = onValue(
      gameRef,
      snapshot => {
        setLoading(false);
        const raw = snapshot.val();
        if (!raw) {
          setGame(null);
          return;
        }
        const parsed = gameStateSchema.safeParse(raw);
        if (parsed.success) {
          setGame(parsed.data);
          setError(null);
        } else {
          // On garde le dernier état valide, mais on signale l'incohérence.
          setError('État de partie invalide reçu du serveur.');
        }
      },
      err => {
        setLoading(false);
        setGame(null);
        setError(err instanceof Error ? err.message : String(err));
      }
    );

    return () => {
      off(gameRef, 'value', unsubscribe);
    };
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [pin]);

  return { game, loading, error };
}
```

### 6.6 Composants clés

#### `AnswerGrid` — réponse en 1 clic (framer-motion)

Grille mobile-first 1×N / 2×2 adaptée au nombre d'options. Verrou après le premier tap (anti double-réponse), feedback haptique optionnel, désactivation hors `QUESTION_ACTIVE`. La soumission part vers une Cloud Function (callable) — jamais un calcul de score local.

```tsx
// src/components/AnswerGrid.tsx
import { motion } from 'framer-motion';
import { Triangle, Diamond, Circle, Square } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

interface Option {
  id: string;
  label: string;
}
interface AnswerGridProps {
  options: Option[];
  disabled: boolean;
  onSubmit: (optionId: string) => void;
}

const SHAPES = [Triangle, Diamond, Circle, Square];
const COLORS = ['bg-red-500', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500'];

export function AnswerGrid({ options, disabled, onSubmit }: AnswerGridProps) {
  const selectedAnswerId = useGameStore(s => s.selectedAnswerId);
  const submitting = useGameStore(s => s.submitting);
  const selectAnswer = useGameStore(s => s.selectAnswer);

  const locked = disabled || submitting || selectedAnswerId !== null;

  function handlePick(id: string) {
    if (locked) return;
    selectAnswer(id); // UI optimiste immédiate
    navigator.vibrate?.(20);
    onSubmit(id); // déclenche la Function callable
  }

  return (
    <div
      className="grid gap-3 p-3"
      style={{ gridTemplateColumns: options.length <= 2 ? '1fr' : '1fr 1fr' }}
      role="group"
      aria-label="Choix de réponse"
    >
      {options.map((opt, i) => {
        const Shape = SHAPES[i % SHAPES.length];
        const isPicked = selectedAnswerId === opt.id;
        return (
          <motion.button
            key={opt.id}
            type="button"
            disabled={locked}
            onClick={() => handlePick(opt.id)}
            whileTap={{ scale: 0.96 }}
            animate={{ opacity: locked && !isPicked ? 0.45 : 1 }}
            className={`${COLORS[i % COLORS.length]} flex min-h-24 items-center
              gap-3 rounded-2xl px-4 text-left text-lg font-semibold text-white
              shadow-lg ring-white/60 disabled:cursor-not-allowed
              ${isPicked ? 'ring-4' : ''}`}
          >
            <Shape className="size-7 shrink-0" aria-hidden />
            <span>{opt.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
```

#### `Leaderboard` — classement animé (réordonnancement framer-motion)

`layout` anime les changements de rang ; `AnimatePresence` gère les entrées/sorties. On dérive et trie la liste **dans le composant** (pas dans un sélecteur Zustand), conformément à la règle du parc.

```tsx
// src/components/Leaderboard.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { Crown } from 'lucide-react';
import type { Player } from '../shared/schemas/game';

interface LeaderboardProps {
  players: Record<string, Player>;
  limit?: number;
}

export function Leaderboard({ players, limit = 8 }: LeaderboardProps) {
  // Tri/slice dans le rendu, pas dans un sélecteur (évite la boucle store).
  const ranked = Object.values(players)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return (
    <ol className="flex flex-col gap-2 p-3" aria-label="Classement">
      <AnimatePresence initial={false}>
        {ranked.map((player, index) => (
          <motion.li
            key={player.uid}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            className="flex items-center justify-between rounded-xl
              bg-white/90 px-4 py-3 shadow dark:bg-slate-800/90"
          >
            <span className="flex items-center gap-3">
              <span className="w-6 text-center font-bold tabular-nums">
                {index + 1}
              </span>
              {index === 0 && (
                <Crown className="size-5 text-amber-400" aria-label="Leader" />
              )}
              <span className="font-medium">{player.nickname}</span>
            </span>
            <motion.span
              key={player.score} // re-anime à chaque variation de score
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="font-bold tabular-nums"
            >
              {player.score}
            </motion.span>
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  );
}
```

#### `Countdown` — compte à rebours synchronisé serveur

S'appuie sur `phaseEndsAt` (temps serveur, ms epoch) plutôt que sur une durée locale : tous les clients voient la **même** échéance, sans dérive d'horloge. L'anneau SVG se vide en continu via `requestAnimationFrame`.

```tsx
// src/components/Countdown.tsx
import { useEffect, useRef, useState } from 'react';

interface CountdownProps {
  /** Échéance en temps serveur (ms epoch). */
  endsAt: number;
  totalMs: number;
  /** Offset horloge serveur−client (fourni par useServerNow). */
  serverOffsetMs?: number;
  onExpire?: () => void;
}

export function Countdown({
  endsAt,
  totalMs,
  serverOffsetMs = 0,
  onExpire,
}: CountdownProps) {
  const [remaining, setRemaining] = useState(totalMs);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    let raf = 0;
    const tick = () => {
      const serverNow = Date.now() + serverOffsetMs;
      const left = Math.max(0, endsAt - serverNow);
      setRemaining(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpire?.();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [endsAt, serverOffsetMs, onExpire]);

  const ratio = totalMs > 0 ? remaining / totalMs : 0;
  const seconds = Math.ceil(remaining / 1000);
  const R = 46;
  const circumference = 2 * Math.PI * R;

  return (
    <div
      className="relative grid size-28 place-items-center"
      role="timer"
      aria-label={`${seconds} secondes restantes`}
    >
      <svg className="absolute size-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={R} className="fill-none stroke-slate-200" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={R}
          className="fill-none stroke-indigo-500 transition-[stroke-dashoffset] duration-100"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
        />
      </svg>
      <span className="text-3xl font-bold tabular-nums">{seconds}</span>
    </div>
  );
}
```

### 6.7 Extrait `vite.config.ts` (base + manifest PWA)

Aligné sur le parc : `base="/mister-qowa/"` (surchargeable par `VITE_BASE_PATH` pour Lighthouse CI), plugin SEO `dev-wpa-config`, `vite-plugin-pwa` en `registerType: 'prompt'`, et un `manualChunks` séparant `firebase` du reste (gros poids réseau).

```typescript
// vite.config.ts (extrait)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { pwaSeoPlugin } from '@mister-guiiug/dev-wpa-config/vite-pwa-base';

const base = process.env.VITE_BASE_PATH ?? '/mister-qowa/';

export default defineConfig({
  base,
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          const n = id.replace(/\\/g, '/');
          if (n.includes('/@firebase/') || n.includes('/firebase/')) return 'firebase';
          if (n.includes('/react-dom/') || n.includes('/node_modules/react/')) return 'react-vendor';
          if (n.includes('/framer-motion/')) return 'motion';
          if (n.includes('/lucide-react/')) return 'lucide';
          if (n.includes('/zustand/')) return 'zustand';
          return 'vendor';
        },
      },
    },
  },
  plugins: [
    pwaSeoPlugin({ siteName: 'Mister Qowa', basePath: base, logoPath: '/logo.svg' }),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Mister Qowa',
        short_name: 'Qowa',
        description: 'Quiz interactifs en temps réel : créez, animez, jouez à plusieurs.',
        start_url: base,
        scope: base,
        theme_color: '#4f46e5',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
```
