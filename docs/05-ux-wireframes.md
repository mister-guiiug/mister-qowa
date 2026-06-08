## 5. UX / Wireframes

> Convention de lecture des wireframes : `█` = bloc plein / fond coloré, `[ … ]` = bouton tactile, `(…)` = champ de saisie, `◀▶` = navigation, `⏱` = chrono. Les wireframes **mobile** (Player) sont prioritaires (375 px de référence) ; les vues **desktop** (Host & Big-screen) sont conçues pour 1280 px+. Tous les flux respectent la machine à états verrouillée `LOBBY → (QUESTION_COUNTDOWN → QUESTION_ACTIVE → QUESTION_REVEAL → LEADERBOARD)* → PODIUM → ENDED`.

### 5.1 Système visuel (design system)

#### 5.1.1 Les 4 couleurs de réponse — couleur **+ forme** (jamais la couleur seule)

L'accessibilité impose qu'une réponse soit identifiable **sans percevoir la couleur** (daltonisme ~8 % des hommes). Chaque slot de réponse combine donc une **couleur vive**, une **forme géométrique** (icône `lucide-react`) et une **position** stable.

| Slot | Couleur (hex) | Forme / icône lucide | Position (mobile 2×2) | Contraste texte |
|------|---------------|----------------------|------------------------|-----------------|
| A | Rouge `#E2253B` | Triangle (`Triangle`) | haut-gauche | texte blanc, ratio ≥ 4.5:1 |
| B | Bleu `#1368CE` | Losange (`Diamond`) | haut-droite | texte blanc |
| C | Jaune `#F2B707` | Rond (`Circle`) | bas-gauche | **texte noir** (jaune clair) |
| D | Vert `#26890C` | Carré (`Square`) | bas-droite | texte blanc |

Pour **vrai/faux**, seuls deux slots sont utilisés : `Vrai = Vert/Carré` (`Check`), `Faux = Rouge/Triangle` (`X`). Pour le **sondage**, mêmes couleurs/formes mais aucun état « bonne réponse » au reveal (barres de répartition neutres).

> Règle verrouillée : la **forme** est toujours rendue à côté du libellé, **côté joueur ET côté big-screen**, pour que l'association forme↔réponse soit apprise une fois et réutilisée à chaque question.

#### 5.1.2 Tokens de design (Tailwind v4 `@theme`)

```css
/* src/index.css — extrait du design system mister-qowa */
@theme {
  /* Couleurs de réponse */
  --color-answer-a: #e2253b; /* rouge — Triangle */
  --color-answer-b: #1368ce; /* bleu  — Losange  */
  --color-answer-c: #f2b707; /* jaune — Rond     */
  --color-answer-d: #26890c; /* vert  — Carré    */

  /* Sémantique d'état */
  --color-correct: #26890c;
  --color-wrong: #e2253b;
  --color-host-bg: #2d0b59; /* violet host/big-screen */

  /* Cibles tactiles & rythme */
  --size-tap-min: 3rem; /* 48px — minimum tactile WCAG 2.5.5 */
  --radius-card: 1rem;
}

/* Respect global de reduced-motion : neutralise toute animation
   résiduelle (CSS) si JS ne l'a pas déjà fait via framer-motion. */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### 5.2 HOST — Desktop (animation de la partie)

#### 5.2.1 Création de quiz (dashboard)

```
┌──────────────────────────────────────────────────────────────────────┐
│  mister-qowa            [🔍 Rechercher un quiz]      (👤 Léa ▾)        │ ← Navbar lucide
├──────────────────────────────────────────────────────────────────────┤
│  MES QUIZ                                       [ + Nouveau quiz ]     │
│  ────────────────────────────────────────────────────────────────     │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐             │
│  │ ▦ vignette     │ │ ▦ vignette     │ │  + Importer    │             │
│  │ Capitales 🌍   │ │ Sciences ⚛     │ │  depuis banque │             │
│  │ 12 questions   │ │ 8 questions    │ │  de questions  │             │
│  │ [Lancer▸][⋯]   │ │ [Lancer▸][⋯]   │ │                │             │
│  └────────────────┘ └────────────────┘ └────────────────┘             │
└──────────────────────────────────────────────────────────────────────┘
```
*Commentaire : `[Lancer▸]` déclenche la Cloud Function `allocatePin` (PIN 6 chiffres) et fait passer la partie en `LOBBY`. La banque de questions Firestore est réutilisable entre quiz.*

#### 5.2.2 Éditeur de question

```
┌──────────────────────────────────────────────────────────────────────┐
│ ◀ Retour     Quiz « Capitales »  ·  Question 3/12     [ Enregistrer ] │
├───────────────┬──────────────────────────────────────────────────────┤
│  QUESTIONS     │  Type : (●) Choix multiple ( ) V/F ( ) Libre ( ) Sond.│
│  1 ▦ Intro     │  ┌────────────────────────────────────────────────┐  │
│  2 ▦ Europe    │  │ ( Quelle est la capitale de l'Australie ?     )│  │
│ ▶3 ▦ Océanie◀  │  └────────────────────────────────────────────────┘  │
│  4 + ajouter   │  [ 🖼 Ajouter média (image/vidéo → Firebase Storage)] │
│                │                                                      │
│                │  ▲Rouge  ( Sydney            )      ( ) bonne rép.   │
│                │  ◆Bleu   ( Canberra          )      (●) bonne rép. ✓ │
│                │  ●Jaune  ( Melbourne         )      ( ) bonne rép.   │
│                │  ■Vert   ( Perth             )      ( ) bonne rép.   │
│                │                                                      │
│                │  ⏱ Temps limite : [ 20 s ▾ ]   Points : [1000 ▾]    │
│                │  Série (streak) : [✓] bonus +10%/bonne réponse       │
└───────────────┴──────────────────────────────────────────────────────┘
```
*Commentaire : la **forme** précède chaque champ de réponse — l'host visualise dès l'édition l'association couleur↔forme que verront les joueurs. Validation `zod` à l'enregistrement (au moins 1 bonne réponse pour QCM/V-F, 0 pour sondage).*

#### 5.2.3 Lobby (avec PIN)

```
┌──────────────────────────────────────────────────────────────────────┐
│                          R E J O I G N E Z   S U R                     │
│                          mister-guiiug.github.io/mister-qowa           │
│                                                                        │
│                    PIN : █ 4  8  2  9  1  7 █     [ ▭ QR ]             │
│                                                                        │
│   Joueurs connectés : 247                       [ ▶ Démarrer la partie]│
│   ┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐              │
│   │ 🦊 Zoé ││ 🐼 Sam││ 🦁 Max││ 🐙 Lou││ 🦉 Ana││  +242 ││ ← entrée    │
│   └───────┘└───────┘└───────┘└───────┘└───────┘└───────┘   animée     │
└──────────────────────────────────────────────────────────────────────┘
```
*Commentaire : présence live via **RTDB** (`onDisconnect` retire le joueur). Chaque avatar entre avec un `spring` framer-motion (voir 5.5). Le compteur « +242 » évite de monter 1000+ nœuds DOM (virtualisation au-delà de ~30 vignettes).*

#### 5.2.4 Écran question / reveal / leaderboard (Host)

```
QUESTION_ACTIVE                          QUESTION_REVEAL
┌────────────────────────────┐          ┌────────────────────────────┐
│ Q3/12          ⏱ ◓ 14s     │          │ Bonne réponse : ◆ Canberra │
│ Capitale de l'Australie ?  │          │                            │
│                            │          │ ▲ Sydney    ███ 38%        │
│   ▲ Sydney     ◆ Canberra  │   ───▶   │ ◆ Canberra  █████ 51% ✓    │
│   ● Melbourne  ■ Perth      │          │ ● Melbourne ██ 7%          │
│                            │          │ ■ Perth     █ 4%           │
│ Réponses reçues : 198/247  │          │      [ ▶ Classement ]      │
└────────────────────────────┘          └────────────────────────────┘
```
*Commentaire : côté host on **n'affiche pas** les libellés sur le big-screen pendant `QUESTION_ACTIVE` si l'on veut forcer les joueurs à lire leur propre écran — option configurable. Les % de répartition viennent de l'agrégat RTDB ; le « ✓ » officiel vient de la Cloud Function (le client ne décide jamais).*

#### 5.2.5 Leaderboard & Podium (Host)

```
LEADERBOARD (top 5)                      PODIUM (ENDED)
┌────────────────────────────┐          ┌────────────────────────────┐
│  CLASSEMENT                │          │            🏆              │
│  ① 🦊 Zoé      8 420  ▲+2  │          │          ┌────┐            │
│  ② 🐼 Sam      8 110  ▼−1  │          │     ┌────┤ 🦊 │            │
│  ③ 🦁 Max      7 905  ▲+3  │          │  ┌──┤ 🐼 │Zoé │            │
│  ④ 🐙 Lou      7 640  =    │          │  │② │Sam │8420│            │
│  ⑤ 🦉 Ana      7 200  ▲+1  │          │  │③ │8110│    │            │
│        [ ▶ Question suivante ]│        │  │Max│    │    │            │
└────────────────────────────┘          └──┴───┴────┴────┴───────────┘
```
*Commentaire : flèches `▲ ▼ =` + couleur = double encodage du mouvement de rang (pas seulement la couleur). Les barres montent avec un `layout` framer-motion (réordonnancement animé, voir 5.5).*

---

### 5.3 PLAYER — Mobile (parcours complet, mobile-first)

```
1. REJOINDRE              2. PSEUDO                3. ATTENTE (lobby)
┌───────────────┐         ┌───────────────┐        ┌───────────────┐
│   mister-qowa │         │   mister-qowa │        │   mister-qowa │
│      🎯       │         │               │        │               │
│               │         │  Ton pseudo : │        │  🦊 Zoé       │
│  ┌─────────┐  │         │ ┌───────────┐ │        │               │
│  │ _ _ _ _ _ _│ │       │ │( Zoé      )│ │        │   En attente  │
│  └─────────┘  │         │ └───────────┘ │        │   du host…    │
│  Entre le PIN │         │  🦊 🐼 🦁 🐙   │        │   ● ● ●       │ ← dots
│               │         │  (avatar)     │        │   pulsés      │
│ [ Rejoindre ▸]│         │ [ C'est parti]│        │  247 joueurs  │
└───────────────┘         └───────────────┘        └───────────────┘
   clavier num.              Auth anonyme            présence RTDB
```

```
4. RÉPONSE (1 clic)       5a. FEEDBACK JUSTE       5b. FEEDBACK FAUX
┌───────────────┐         ┌───────────────┐        ┌───────────────┐
│ Q3   ⏱ ◓ 12s  │         │███████████████│        │███████████████│
│               │         │███   ✓   ██████│        │███   ✗   ██████│
│ ┌─────┬─────┐ │         │██  CORRECT ! ██│        │██   RATÉ…    █│
│ │▲    │◆    │ │         │███████████████│        │███████████████│
│ │Rouge│Bleu │ │         │  + 920 points │        │   + 0 point   │
│ ├─────┼─────┤ │         │  🔥 série ×3   │        │ Bonne rép. :  │
│ │●    │■    │ │         │               │        │  ◆ Canberra   │
│ │Jaune│Vert │ │         │  Rang : 1ᵉʳ ▲ │        │  Rang : 14ᵉ ▼ │
│ └─────┴─────┘ │         └───────────────┘        └───────────────┘
└───────────────┘          fond VERT + ✓             fond ROUGE + ✗
```

```
6. SON RANG (inter-Q)     7. PODIUM (fin)
┌───────────────┐         ┌───────────────┐
│   Tu es       │         │      🏆        │
│      4ᵉ       │         │   Tu finis     │
│   sur 247     │         │      2ᵉ !      │
│               │         │   ┌─────┐      │
│  7 640 pts    │         │   │ 🐼  │ 🎉   │
│  ▲ +3 places  │         │   └─────┘      │
│               │         │  8 110 points  │
│ Plus que 9 Q  │         │ [ Rejouer ][↗] │
└───────────────┘         └───────────────┘
```
*Commentaires clés (mobile) :*
- *Grille de réponse **plein écran 2×2** : chaque tuile fait ≥ 48 % de la largeur et ≥ 25 % de la hauteur → cible tactile très au-dessus du minimum WCAG (48 px). **Un seul tap** envoie la réponse via RTDB (write `answers/{gameId}/{playerId}`), puis l'écran passe en « réponse envoyée » verrouillé (pas de double-soumission).*
- *Le téléphone **ne calcule pas** le score : il affiche `+points` / `rang` **après** la décision de la Cloud Function (poussée par RTDB). En attendant, état « ⏳ … ».*
- *Feedback **multi-canal** : couleur de fond **+** icône `✓/✗` **+** texte « CORRECT / RATÉ » **+** vibration (`navigator.vibrate`, court=juste, double=faux) — désactivable, jamais le seul signal.*
- *Le **streak** 🔥 est un élément de gamification (mascotte/emoji autorisé dans le **contenu**, conformément à la convention : lucide pour l'UI, emoji pour le contenu/mascotte).*

---

### 5.4 BIG-SCREEN — Desktop partagé (lecture seule de l'état host)

```
┌──────────────────────────────────────────────────────────────────────┐
│  mister-qowa                                            PIN 482917     │
│                                                                        │
│              Q3/12 · Capitale de l'Australie ?         ⏱ ◓◓◓◑ 14      │
│   ┌──────────────────────────┐   ┌──────────────────────────┐         │
│   │ ▲  SYDNEY                │   │ ◆  CANBERRA              │         │
│   └──────────────────────────┘   └──────────────────────────┘         │
│   ┌──────────────────────────┐   ┌──────────────────────────┐         │
│   │ ●  MELBOURNE             │   │ ■  PERTH                 │         │
│   └──────────────────────────┘   └──────────────────────────┘         │
│                                                                        │
│   ████████████████  Réponses : 198 / 247        🦊 Zoé mène (8420)    │
└──────────────────────────────────────────────────────────────────────┘
```
*Commentaire : le big-screen est un **abonné en lecture seule** de la RTDB (`games/{gameId}/state`). Il ne possède aucune action ; toute transition d'état est décidée par le host (via Cloud Function). Grandes typographies, fortes tailles, contraste élevé — pensé pour être lu à 5–10 m. Le QR/PIN reste affiché en `LOBBY` puis se réduit en coin pour les retardataires.*

---

### 5.5 Animations framer-motion

Toutes les animations sont **désactivées/raccourcies** si `prefers-reduced-motion: reduce` (hook `useReducedMotion`, déjà présent dans le parc : `src/hooks/useReducedMotion.ts`). Pattern : on calcule des `variants` conditionnels et on coupe `transition` à `duration: 0`.

```tsx
// src/animations/qowaMotion.ts — variants centralisés
import type { Variants, Transition } from 'framer-motion';

// Spring « rebond » réutilisé (entrée joueur, tuiles de réponse)
export const springPop: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 22,
};

// Entrée d'un avatar dans le lobby (stagger côté parent)
export const avatarVariants: Variants = {
  hidden: { opacity: 0, scale: 0.4, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: springPop },
};

// Transition entre 2 questions (slide horizontal type carrousel)
export const questionVariants: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};
```

```tsx
// Exemple : grille de réponse joueur, respect du reduced-motion
import { motion } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { springPop } from '../animations/qowaMotion';

export function AnswerTile({ slot, onPick }: AnswerTileProps) {
  const reduced = useReducedMotion();
  return (
    <motion.button
      type="button"
      onClick={onPick}
      aria-label={`Réponse ${slot.letter} : ${slot.label}`}
      className="answer-tile" /* couleur via --color-answer-* */
      whileTap={reduced ? undefined : { scale: 0.94 }}
      animate={reduced ? false : { scale: 1 }}
      transition={reduced ? { duration: 0 } : springPop}
    >
      <slot.ShapeIcon aria-hidden /> {/* forme lucide, redondante à la couleur */}
      <span>{slot.label}</span>
    </motion.button>
  );
}
```

| Moment | Animation | Détail framer-motion | Si reduced-motion |
|--------|-----------|----------------------|-------------------|
| **Transition de question** | Slide carrousel + fondu | `AnimatePresence mode="wait"` + `questionVariants` (custom `dir`) | Fondu seul, `duration: 0.01` |
| **Compte à rebours** | Anneau qui se vide + pulse à ≤ 3 s | `motion.circle` sur `strokeDashoffset` ; `scale:[1,1.08,1]` en boucle à 3 s | Anneau statique, chiffre qui change |
| **Tuile tapée** | `whileTap scale 0.94` + flash | `springPop` | Pas de scale, focus-ring CSS |
| **Reveal bonne réponse** | Barres % qui grandissent (`scaleX`), ✓ qui apparaît en `springPop` | `initial scaleX:0 → animate scaleX:pct` (`transformOrigin:left`) | Barres déjà à leur taille |
| **Montée du leaderboard** | Réordonnancement animé des lignes | `layout` + `LayoutGroup` (FLIP automatique) | `layout={false}`, saut instantané |
| **Podium** | 3e puis 2e puis 1re marche montent en `stagger`, confettis 🎉 | `staggerChildren: 0.25`, `spring` sur `height` ; confettis désactivables | Marches affichées d'emblée, pas de confettis |
| **Feedback juste/faux** | Fond plein qui « pop » (`scale 0.9→1`) + icône | `springPop`, vibration en parallèle | Changement de fond instantané |

*Note perf 1000+ joueurs : les animations lourdes (confettis, stagger massif) tournent **uniquement** sur Host/Big-screen ; le **mobile joueur** reste minimal (1 tuile tapée, 1 transition de feedback) pour préserver la batterie et le frame-rate sur entrée de gamme.*

---

### 5.6 Gamification

- **Série (streak) 🔥** : badge incrémental + bonus de points serveur (`+x %`, paramétrable par question). Affiché côté joueur au feedback et côté host au leaderboard.
- **Vitesse récompensée** : le scoring Kahoot (verrouillé) rend la rapidité visible — micro-texte « ⚡ Réponse rapide ! » quand `responseTimeMs < timeLimitMs/2`.
- **Avatars animaliers** : choisis à l'inscription, persistés au pseudo (réutilisation des utilitaires `pseudo` du parc), porteurs d'identité tout au long de la partie.
- **Variation de rang** : flèches `▲▼=` + delta de places à chaque inter-question, micro-récit (« +3 places ! ») pour entretenir la tension.
- **Podium festif** : confettis + marches animées + bouton **Rejouer / Partager** (lien `REPO_URL`, sponsor Buy Me a Coffee via `src/links.ts`).
- **Mode async/solo & équipe** : en solo, barre de progression « Q x/12 » auto-rythmée ; en équipe, le feedback joueur affiche **aussi** le score agrégé de l'équipe.

---

### 5.7 Accessibilité (transverse, non négociable)

| Exigence | Mise en œuvre mister-qowa |
|----------|---------------------------|
| **Couleur jamais seule** | Chaque réponse = couleur **+ forme lucide** (`Triangle/Diamond/Circle/Square`) + position fixe ; feedback = fond **+ icône `✓/✗`** + texte. |
| **Contraste** | Texte/fond ≥ 4.5:1 (jaune → **texte noir**) ; big-screen visé AAA (≥ 7:1). Support `prefers-contrast: high` (hook parc `usePrefersHighContrast`). |
| **Cibles tactiles** | Tuiles réponse ≥ 48 px (en pratique ~½ écran) ; tout bouton ≥ `--size-tap-min` (48 px) ; espacement anti-mistap. |
| **Reduced-motion** | `useReducedMotion` coupe slides, confettis, pulses, réordonnancements (table 5.5). Aucune information portée *uniquement* par le mouvement. |
| **Lecteurs d'écran** | `aria-label` sur chaque tuile (« Réponse B : Canberra ») ; chrono en `aria-live="polite"` à intervalles (pas chaque seconde) ; résultat annoncé via `A11yAnnouncer` (composant parc) : « Correct, +920 points, 1er ». |
| **Clavier (host/big-screen desktop)** | Navigation `Tab`, raccourcis host (Espace = question suivante), `useFocusTrap`/`useEscapeHandler` (hooks parc) pour les modales d'édition. |
| **Daltonisme** | Palette rouge/bleu/jaune/vert testée Deuteranopia/Protanopia ; les **formes** lèvent toute ambiguïté résiduelle. |
| **Time-out équitable** | Le chrono visuel (anneau) + textuel ; option host « rallonger le temps » ; jamais de pénalité de *layout shift* sur petit écran (hauteurs réservées). |

> Synthèse : le triptyque **couleur + forme + position** côté réponses, et **fond + icône + texte (+ vibration)** côté feedback, garantit qu'un joueur daltonien, malvoyant ou en `reduced-motion` joue à armes égales — exigence directement câblée dans les composants `AnswerTile`, `CountdownRing`, `FeedbackOverlay` et `Leaderboard`.

Fichiers de référence consultés (parc, pour alignement des patterns) : `D:/Src/GithubMisterGuiiuG/mister-puzzle/src/hooks/useReducedMotion.ts` et `D:/Src/GithubMisterGuiiuG/mister-puzzle/src/hooks/useAccessibility.tsx`.
