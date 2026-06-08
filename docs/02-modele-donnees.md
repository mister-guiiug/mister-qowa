## 2. Modèle de données

Cette section définit le modèle de données complet de mister-qowa selon la séparation **durable vs. live** verrouillée dans la brief : **Firestore** pour les données persistantes (comptes, contenu, parties terminées, analytics), **Realtime Database (RTDB)** pour l'état de jeu temps réel haute fréquence, et une variante relationnelle **PostgreSQL** pour le self-hosted V2. Tous les schémas applicatifs sont validés par **zod v4** (frontière client/Cloud Functions), identifiants en anglais.

### 2.1 Principe de séparation des stockages

| Critère | Firestore | RTDB |
|---|---|---|
| Nature | Document durable, requêtable, indexé | Arbre JSON, fan-out faible latence |
| Fréquence d'écriture | Faible (création/édition de contenu, fin de partie) | Très élevée (réponses, présence, leaderboard live) |
| Lecture | Requêtes filtrées/paginées | Abonnement temps réel sub-100 ms, `onDisconnect` |
| Source de vérité du score | Oui (snapshot final écrit par Cloud Function) | Non (état transitoire, recalculé serveur) |
| Coût à 1000+ joueurs | Élevé si écritures live (1 doc/réponse) | Optimisé (fan-out natif, facturation au volume) |

La règle structurante : **toute écriture à haute fréquence pendant une partie va dans RTDB** ; Firestore ne reçoit qu'un **snapshot final** (`games` + `gameResults`) produit par une Cloud Function à `ENDED`. Le client n'écrit jamais le score officiel.

### 2.2 Schéma Firestore (données durables)

Notation : `coll/{id}` = collection ; les champs marqués `🔒` ne sont jamais écrits par le client (Cloud Functions uniquement).

#### `users/{uid}`
Compte host (clé = `uid` Firebase Auth). Les invités anonymes n'ont **pas** de document `users`.

| Champ | Type | Notes |
|---|---|---|
| `uid` | `string` | = doc id, = Auth uid |
| `displayName` | `string` | |
| `email` | `string \| null` | null si compte non-Google |
| `photoURL` | `string \| null` | |
| `provider` | `'google' \| 'anonymous'` | |
| `role` | `'host' \| 'admin'` | défaut `host` |
| `createdAt` | `Timestamp` | |
| `lastSeenAt` | `Timestamp` | |
| `stats` | `map` | `🔒 { quizzesCreated, gamesHosted, totalPlayers }` agrégés par CF |

#### `quizzes/{quizId}`
Métadonnées du quiz (les questions sont en sous-collection pour pagination + permissions fines).

| Champ | Type | Notes |
|---|---|---|
| `quizId` | `string` | = doc id |
| `ownerUid` | `string` | → `users/{uid}` |
| `title` | `string` | 1–120 car. |
| `description` | `string` | ≤ 500 car. |
| `coverImageUrl` | `string \| null` | Firebase Storage |
| `visibility` | `'private' \| 'unlisted' \| 'public'` | |
| `language` | `string` | BCP-47 (`fr`, `en`…) |
| `tags` | `string[]` | ≤ 10 |
| `questionCount` | `number` | 🔒 dénormalisé (CF) |
| `defaultTimeLimitMs` | `number` | hérité par question |
| `defaultBasePoints` | `number` | |
| `streakBonusEnabled` | `boolean` | |
| `status` | `'draft' \| 'published'` | |
| `createdAt` / `updatedAt` | `Timestamp` | |

#### `quizzes/{quizId}/questions/{questionId}`
Question rattachée à un quiz (sous-collection). Discriminée par `type` (cf. zod §2.5).

| Champ | Type | Notes |
|---|---|---|
| `questionId` | `string` | = doc id |
| `order` | `number` | rang dans le quiz |
| `type` | `'multiple_choice' \| 'true_false' \| 'free_text' \| 'poll'` | discriminant |
| `prompt` | `string` | énoncé |
| `mediaUrl` | `string \| null` | image/vidéo Storage |
| `timeLimitMs` | `number` | |
| `basePoints` | `number` | 0 si `poll` |
| `options` | `Option[] \| null` | MC / vrai-faux / sondage |
| `correctOptionIds` | `string[] \| null` | null pour `poll` |
| `acceptedAnswers` | `string[] \| null` | `free_text` (formes normalisées) |
| `caseSensitive` | `boolean \| null` | `free_text` |
| `createdAt` / `updatedAt` | `Timestamp` | |

#### `questionBank/{questionId}`
Banque réutilisable, indépendante d'un quiz (import dans plusieurs quiz). Même forme que `questions` + `ownerUid`, `visibility`, `tags`, `usageCount 🔒`. Permet la recherche transverse.

#### `games/{gameId}` (parties TERMINÉES uniquement)
Écrit **une seule fois** par la Cloud Function de clôture (snapshot immuable de l'état live).

| Champ | Type | Notes |
|---|---|---|
| `gameId` | `string` | = doc id (≠ PIN, qui est éphémère) |
| `quizId` | `string` | → quiz source |
| `hostUid` | `string` | |
| `pin` | `string` | 🔒 PIN utilisé (historique) |
| `mode` | `'live' \| 'async' \| 'team'` | |
| `playerCount` | `number` | 🔒 |
| `startedAt` / `endedAt` | `Timestamp` | 🔒 |
| `questionSnapshots` | `array<map>` | 🔒 copie figée des questions jouées |
| `finalState` | `'ENDED' \| 'ABORTED'` | 🔒 |

#### `games/{gameId}/gameResults/{playerId}` (sous-collection)
Un document par joueur — résultat **officiel** figé.

| Champ | Type | Notes |
|---|---|---|
| `playerId` | `string` | = doc id |
| `nickname` | `string` | 🔒 |
| `uid` | `string \| null` | 🔒 si joueur authentifié |
| `teamId` | `string \| null` | 🔒 mode équipe |
| `totalScore` | `number` | 🔒 calculé serveur |
| `rank` | `number` | 🔒 |
| `correctCount` | `number` | 🔒 |
| `maxStreak` | `number` | 🔒 |
| `perQuestion` | `array<map>` | 🔒 `{ questionId, points, responseTimeMs, correct }` |

#### `analytics/{gameId}` (agrégats post-partie)
Écrit par CF : distribution des réponses, % de réussite par question, courbe d'engagement. Champs : `quizId`, `questionStats: map<questionId, { correctRate, avgResponseTimeMs, optionDistribution }>`, `dropoffByQuestion: number[]`, `computedAt: Timestamp`. Tout `🔒`.

#### Index Firestore (composites)

| Collection | Index | Usage |
|---|---|---|
| `quizzes` | `ownerUid ASC, updatedAt DESC` | « mes quiz » |
| `quizzes` | `visibility ASC, language ASC, updatedAt DESC` | catalogue public |
| `quizzes/*/questions` | `order ASC` | lecture ordonnée (single-field suffit) |
| `questionBank` | `ownerUid ASC, tags ARRAY, updatedAt DESC` | recherche perso par tag |
| `questionBank` | `visibility ASC, tags ARRAY` | banque publique |
| `games` | `hostUid ASC, endedAt DESC` | historique host |
| `games` | `quizId ASC, endedAt DESC` | parties d'un quiz |
| `games/*/gameResults` | `rank ASC` | classement final paginé |

### 2.3 Arbre RTDB de l'état live

Racine `/sessions/{pin}` où `{pin}` = PIN 6 chiffres (durée de vie = la partie ; supprimé à `ENDED+TTL`).

```
/sessions/{pin}
├── meta
│   ├── gameId            : string          // lien vers le futur doc games/
│   ├── quizId            : string
│   ├── hostUid           : string
│   ├── mode              : "live"|"async"|"team"
│   ├── state             : "LOBBY"|"QUESTION_COUNTDOWN"|"QUESTION_ACTIVE"
│   │                       |"QUESTION_REVEAL"|"LEADERBOARD"|"PODIUM"|"ENDED"
│   ├── currentQuestionIndex : number
│   ├── totalQuestions    : number
│   ├── locked            : boolean         // lobby fermé
│   └── serverNow         : number          // ServerValue.TIMESTAMP (sync horloge)
│
├── players/{playerId}                      // playerId = clé push() ou uid
│   ├── nickname          : string
│   ├── uid               : string|null
│   ├── teamId            : string|null
│   ├── joinedAt          : number
│   ├── connected         : boolean         // onDisconnect → false
│   ├── score             : number          // 🔒 miroir, écrit par CF
│   └── streak            : number          // 🔒
│
├── currentQuestion                         // une seule question exposée à la fois
│   ├── questionId        : string
│   ├── type              : string
│   ├── prompt            : string
│   ├── mediaUrl          : string|null
│   ├── options           : { [optId]: { text, mediaUrl? } }   // PAS de correctOptionIds ici (anti-triche)
│   ├── startedAt         : number          // ServerValue.TIMESTAMP
│   ├── endsAt            : number          // startedAt + timeLimitMs
│   └── revealed          : boolean         // true en QUESTION_REVEAL → expose la/les bonnes réponses
│
├── answers/{questionId}/{playerId}         // 🔒 lisible host/CF seulement
│   ├── optionIds         : string[]|null
│   ├── text              : string|null     // free_text
│   ├── submittedAt       : number          // ServerValue.TIMESTAMP
│   └── responseTimeMs    : number          // 🔒 recalculé/validé par CF
│
├── leaderboard                             // top N dénormalisé pour affichage live
│   └── {rank}            : { playerId, nickname, score, teamId? }
│
└── reactions                               // émojis éphémères (fun, non scorés)
    └── {pushId}          : { playerId, emoji, at }   // purgés par CF/TTL
```

**Justification de la forme pour le fan-out :**

- **`/sessions/{pin}` comme racine partagée** : tous les clients d'une partie s'abonnent au même sous-arbre. La diffusion d'un changement (`state`, `currentQuestion`) est un **fan-out natif RTDB** vers 1000+ sockets sans requête par client.
- **`currentQuestion` aplati et SANS bonnes réponses** : on n'expose qu'**une** question à la fois et on **omet `correctOptionIds`** (anti-triche : impossible d'inspecter le payload). Les réponses correctes ne descendent qu'à `revealed: true`. Énoncé aplati = un seul listener léger côté joueur.
- **`answers/{questionId}/{playerId}` partitionné par question** : chaque joueur n'écrit qu'à **son** chemin (`.write` scoping par `auth.uid`/clé), zéro contention ; le host/CF lit l'agrégat `answers/{questionId}`. Branche **protégée en lecture** côté joueur (Security Rules) → personne ne voit les réponses des autres avant le reveal.
- **`leaderboard` pré-calculé et dénormalisé** : le client ne trie pas 1000 joueurs ; la CF écrit un top N déjà ordonné → lecture O(N) constante, fan-out d'un petit nœud.
- **`players/{id}.connected` + `onDisconnect`** : présence native, pas de heartbeat applicatif. `score`/`streak` sont des **miroirs** écrits par CF (jamais par le joueur).
- **`reactions` en `push()`** : append-only à clé chronologique, purgé par TTL → pas de croissance non bornée du sous-arbre live.

> Sécurité (résumé, détaillée en section Security Rules) : un joueur ne peut écrire que `players/{self}` et `answers/{q}/{self}` ; `meta`, `currentQuestion`, `leaderboard`, et tous les champs `🔒` sont **read-only** côté client et écrits par Cloud Functions / host autorisé.

### 2.4 Diagramme ER (mermaid)

```mermaid
erDiagram
    USERS ||--o{ QUIZZES : "owns"
    USERS ||--o{ QUESTION_BANK : "owns"
    QUIZZES ||--o{ QUESTIONS : "contains"
    QUESTION_BANK ..o{ QUESTIONS : "imported into"
    USERS ||--o{ GAMES : "hosts"
    QUIZZES ||--o{ GAMES : "instantiated as"
    GAMES ||--o{ GAME_RESULTS : "produces"
    GAMES ||--|| ANALYTICS : "aggregated into"
    GAME_RESULTS }o--o| USERS : "may belong to"

    USERS {
        string uid PK
        string displayName
        string email
        string provider
        string role
        timestamp createdAt
    }
    QUIZZES {
        string quizId PK
        string ownerUid FK
        string title
        string visibility
        string status
        number questionCount
        timestamp updatedAt
    }
    QUESTIONS {
        string questionId PK
        string quizId FK
        number order
        string type
        string prompt
        number timeLimitMs
        number basePoints
    }
    QUESTION_BANK {
        string questionId PK
        string ownerUid FK
        string type
        string prompt
        number usageCount
    }
    GAMES {
        string gameId PK
        string quizId FK
        string hostUid FK
        string pin
        string mode
        number playerCount
        timestamp endedAt
    }
    GAME_RESULTS {
        string playerId PK
        string gameId FK
        string uid FK
        number totalScore
        number rank
        number maxStreak
    }
    ANALYTICS {
        string gameId PK
        string quizId FK
        timestamp computedAt
    }
```

### 2.5 Schémas zod v4

Validation à la frontière (formulaires d'édition, payloads Cloud Functions, écritures RTDB). zod v4 : `z.enum`, `z.discriminatedUnion`, `z.iso.datetime()`, `z.int()`.

```ts
import { z } from 'zod';

/* ---------- Primitives ---------- */
export const pinSchema = z.string().regex(/^\d{6}$/, 'PIN = 6 chiffres');
export const idSchema = z.string().min(1).max(128);
export const nicknameSchema = z.string().trim().min(1).max(20);

export const questionTypeSchema = z.enum([
  'multiple_choice',
  'true_false',
  'free_text',
  'poll',
]);

export const optionSchema = z.object({
  id: idSchema,
  text: z.string().min(1).max(120),
  mediaUrl: z.string().url().nullable().default(null),
});

/* ---------- Question : union discriminée des 4 types ---------- */
const questionBase = z.object({
  questionId: idSchema,
  order: z.int().nonnegative(),
  prompt: z.string().min(1).max(400),
  mediaUrl: z.string().url().nullable().default(null),
  timeLimitMs: z.int().min(5_000).max(120_000),
});

export const multipleChoiceSchema = questionBase.extend({
  type: z.literal('multiple_choice'),
  basePoints: z.int().min(0).max(2000),
  options: z.array(optionSchema).min(2).max(4),
  correctOptionIds: z.array(idSchema).min(1),
});

export const trueFalseSchema = questionBase.extend({
  type: z.literal('true_false'),
  basePoints: z.int().min(0).max(2000),
  options: z.array(optionSchema).length(2),
  correctOptionIds: z.array(idSchema).length(1),
});

export const freeTextSchema = questionBase.extend({
  type: z.literal('free_text'),
  basePoints: z.int().min(0).max(2000),
  acceptedAnswers: z.array(z.string().min(1)).min(1).max(20),
  caseSensitive: z.boolean().default(false),
});

export const pollSchema = questionBase.extend({
  type: z.literal('poll'),
  basePoints: z.literal(0).default(0), // sondage => 0 point
  options: z.array(optionSchema).min(2).max(4),
});

export const questionSchema = z.discriminatedUnion('type', [
  multipleChoiceSchema,
  trueFalseSchema,
  freeTextSchema,
  pollSchema,
]);
export type Question = z.infer<typeof questionSchema>;

/* ---------- Quiz ---------- */
export const quizSchema = z.object({
  quizId: idSchema,
  ownerUid: idSchema,
  title: z.string().trim().min(1).max(120),
  description: z.string().max(500).default(''),
  coverImageUrl: z.string().url().nullable().default(null),
  visibility: z.enum(['private', 'unlisted', 'public']).default('private'),
  language: z.string().min(2).max(10).default('fr'),
  tags: z.array(z.string().min(1).max(30)).max(10).default([]),
  defaultTimeLimitMs: z.int().min(5_000).max(120_000).default(20_000),
  defaultBasePoints: z.int().min(0).max(2000).default(1000),
  streakBonusEnabled: z.boolean().default(true),
  status: z.enum(['draft', 'published']).default('draft'),
});
export type Quiz = z.infer<typeof quizSchema>;

/* ---------- Player (RTDB) ---------- */
export const playerSchema = z.object({
  playerId: idSchema,
  nickname: nicknameSchema,
  uid: idSchema.nullable().default(null),
  teamId: idSchema.nullable().default(null),
  joinedAt: z.int().positive(),
  connected: z.boolean().default(true),
  score: z.int().nonnegative().default(0), // miroir, autorité CF
  streak: z.int().nonnegative().default(0),
});
export type Player = z.infer<typeof playerSchema>;

/* ---------- AnswerSubmission (client -> RTDB/CF) ---------- */
export const answerSubmissionSchema = z
  .object({
    pin: pinSchema,
    questionId: idSchema,
    playerId: idSchema,
    optionIds: z.array(idSchema).min(1).nullable().default(null), // MC/VF/poll
    text: z.string().trim().min(1).max(200).nullable().default(null), // free_text
    // submittedAt/responseTimeMs sont posés par le serveur (jamais par le client)
  })
  .refine((a) => a.optionIds !== null || a.text !== null, {
    message: 'Réponse vide : optionIds ou text requis',
  });
export type AnswerSubmission = z.infer<typeof answerSubmissionSchema>;

/* ---------- GameState (état de partie, machine à états) ---------- */
export const gameStateSchema = z.enum([
  'LOBBY',
  'QUESTION_COUNTDOWN',
  'QUESTION_ACTIVE',
  'QUESTION_REVEAL',
  'LEADERBOARD',
  'PODIUM',
  'ENDED',
]);
export type GameState = z.infer<typeof gameStateSchema>;

export const sessionMetaSchema = z.object({
  gameId: idSchema,
  quizId: idSchema,
  hostUid: idSchema,
  mode: z.enum(['live', 'async', 'team']).default('live'),
  state: gameStateSchema.default('LOBBY'),
  currentQuestionIndex: z.int().nonnegative().default(0),
  totalQuestions: z.int().positive(),
  locked: z.boolean().default(false),
});
export type SessionMeta = z.infer<typeof sessionMetaSchema>;
```

> Note anti-triche : `correctOptionIds`/`acceptedAnswers` font partie du schéma **côté Firestore/CF** mais ne sont **jamais sérialisés dans `/sessions/{pin}/currentQuestion`**. La validation de justesse est faite par la Cloud Function de scoring.

### 2.6 Variante relationnelle PostgreSQL (self-hosted V2)

DDL pour la stack alternative (NestJS + PostgreSQL + Redis). L'état live haute fréquence vivrait dans **Redis** (équivalent RTDB) ; PostgreSQL tient le durable. `jsonb` pour les payloads polymorphes (options, snapshots).

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- Enums
CREATE TYPE question_type AS ENUM ('multiple_choice','true_false','free_text','poll');
CREATE TYPE quiz_visibility AS ENUM ('private','unlisted','public');
CREATE TYPE game_mode     AS ENUM ('live','async','team');
CREATE TYPE game_final    AS ENUM ('ENDED','ABORTED');

-- Comptes host
CREATE TABLE users (
    uid          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL,
    email        TEXT UNIQUE,
    photo_url    TEXT,
    provider     TEXT NOT NULL CHECK (provider IN ('google','anonymous')),
    role         TEXT NOT NULL DEFAULT 'host' CHECK (role IN ('host','admin')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ
);

-- Quiz
CREATE TABLE quizzes (
    quiz_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_uid             UUID NOT NULL REFERENCES users(uid) ON DELETE CASCADE,
    title                 TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
    description           TEXT NOT NULL DEFAULT '',
    cover_image_url       TEXT,
    visibility            quiz_visibility NOT NULL DEFAULT 'private',
    language              TEXT NOT NULL DEFAULT 'fr',
    tags                  TEXT[] NOT NULL DEFAULT '{}',
    default_time_limit_ms INT  NOT NULL DEFAULT 20000,
    default_base_points   INT  NOT NULL DEFAULT 1000,
    streak_bonus_enabled  BOOLEAN NOT NULL DEFAULT true,
    status                TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Questions (rattachées à un quiz) ; banque = quiz_id NULL + owner_uid renseigné
CREATE TABLE questions (
    question_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id           UUID REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    owner_uid         UUID REFERENCES users(uid) ON DELETE CASCADE,  -- pour la banque
    "order"           INT  NOT NULL DEFAULT 0,
    type              question_type NOT NULL,
    prompt            TEXT NOT NULL,
    media_url         TEXT,
    time_limit_ms     INT  NOT NULL DEFAULT 20000,
    base_points       INT  NOT NULL DEFAULT 1000,
    options           JSONB,        -- [{id,text,mediaUrl}] ; NULL pour free_text
    correct_option_ids TEXT[],      -- NULL pour poll/free_text
    accepted_answers  TEXT[],       -- free_text uniquement
    case_sensitive    BOOLEAN,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- cohérence par type
    CONSTRAINT poll_zero_points CHECK (type <> 'poll' OR base_points = 0),
    CONSTRAINT free_text_answers CHECK (type <> 'free_text' OR accepted_answers IS NOT NULL),
    CONSTRAINT choice_options    CHECK (type = 'free_text' OR options IS NOT NULL)
);

-- Parties terminées (snapshot immuable)
CREATE TABLE games (
    game_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id            UUID NOT NULL REFERENCES quizzes(quiz_id) ON DELETE RESTRICT,
    host_uid           UUID NOT NULL REFERENCES users(uid) ON DELETE RESTRICT,
    pin                CHAR(6) NOT NULL,
    mode               game_mode NOT NULL DEFAULT 'live',
    player_count       INT NOT NULL DEFAULT 0,
    started_at         TIMESTAMPTZ NOT NULL,
    ended_at           TIMESTAMPTZ NOT NULL,
    question_snapshots JSONB NOT NULL,        -- copie figée des questions jouées
    final_state        game_final NOT NULL DEFAULT 'ENDED'
);

-- Résultats par joueur (officiels)
CREATE TABLE game_results (
    player_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id          UUID NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    uid              UUID REFERENCES users(uid) ON DELETE SET NULL,  -- joueur authentifié
    nickname         TEXT NOT NULL,
    team_id          TEXT,
    total_score      INT NOT NULL DEFAULT 0,
    rank             INT NOT NULL,
    correct_count    INT NOT NULL DEFAULT 0,
    max_streak       INT NOT NULL DEFAULT 0,
    per_question     JSONB NOT NULL DEFAULT '[]'  -- [{questionId,points,responseTimeMs,correct}]
);

-- Analytics (1-1 avec games)
CREATE TABLE analytics (
    game_id        UUID PRIMARY KEY REFERENCES games(game_id) ON DELETE CASCADE,
    quiz_id        UUID NOT NULL REFERENCES quizzes(quiz_id) ON DELETE CASCADE,
    question_stats JSONB NOT NULL,   -- {questionId: {correctRate,avgResponseTimeMs,optionDistribution}}
    dropoff        INT[]  NOT NULL DEFAULT '{}',
    computed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_quizzes_owner_updated  ON quizzes (owner_uid, updated_at DESC);
CREATE INDEX idx_quizzes_public         ON quizzes (visibility, language, updated_at DESC);
CREATE INDEX idx_quizzes_tags           ON quizzes USING GIN (tags);
CREATE INDEX idx_questions_quiz_order   ON questions (quiz_id, "order");
CREATE INDEX idx_questions_bank_owner   ON questions (owner_uid) WHERE quiz_id IS NULL;
CREATE INDEX idx_games_host_ended       ON games (host_uid, ended_at DESC);
CREATE INDEX idx_games_quiz_ended       ON games (quiz_id, ended_at DESC);
CREATE INDEX idx_results_game_rank      ON game_results (game_id, rank);
CREATE UNIQUE INDEX uq_results_game_uid ON game_results (game_id, uid) WHERE uid IS NOT NULL;
```

**Correspondance des clés Firestore/RTDB → PostgreSQL :**

| Firestore / RTDB | PostgreSQL | Clé / index |
|---|---|---|
| `users/{uid}` | `users` | PK `uid` |
| `quizzes/{quizId}` | `quizzes` | PK `quiz_id`, FK `owner_uid` |
| `quizzes/*/questions/{id}` | `questions` (`quiz_id` non-null) | FK `quiz_id` + `idx_questions_quiz_order` |
| `questionBank/{id}` | `questions` (`quiz_id` NULL) | `idx_questions_bank_owner` |
| `games/{gameId}` | `games` | PK `game_id` |
| `games/*/gameResults/{id}` | `game_results` | FK `game_id` + `idx_results_game_rank` |
| `analytics/{gameId}` | `analytics` | PK/FK `game_id` (1-1) |
| `/sessions/{pin}` (live) | **Redis** (hors DDL) | clé `session:{pin}` |

> Le PIN n'est **jamais** une clé durable : éphémère dans RTDB/Redis pendant la partie, conservé seulement comme attribut historique (`games.pin`) après clôture.
