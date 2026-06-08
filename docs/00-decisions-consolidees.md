## 0. Décisions consolidées (font foi)

> Ce document **tranche** les divergences trouvées par les 2 revues adverses (24 issues) sur le brouillon
> multi-experts. **En cas de contradiction avec une section 1–8, ce document prime.** C'est lui la spec
> d'implémentation ; les sections détaillées sont la matière, à lire à travers ces décisions.

### Invariants verrouillés

| # | Décision | Pourquoi (issue résolue) |
|---|---|---|
| **D1** | **Clé canonique de l'état live = `sessionId`** (id stable). RTDB racine **`/sessions/{sessionId}`**. Index inverse **`/pins/{pin} → sessionId`**. Le PIN est un *alias de jointure éphémère*, jamais une clé d'arbre. | Bloquant : sections divergeaient entre `/sessions/{pin}`, `/games/{gameId}`, `/games/{pin}` → front & back incompatibles. |
| **D2** | **Soumission = écriture RTDB directe gardée par Rules** (chemin chaud, faible latence, pas de cold-start). Le callable `submitAnswer` n'est qu'un **fallback** documenté. Un seul jeu de Rules. | Bloquant : deux modèles (callable vs écriture directe) avec Rules contradictoires (`.write:false` vs `.write:auth.uid===$pid`). |
| **D3** | Le nœud réponse ne contient que **`{ choice, serverTs }`**. `serverTs` **forcé** par Rule `.validate: newData.child('serverTs').val() === now`. **`clientTs` supprimé** du calcul. Fenêtre : `.validate: now < currentQuestion.endsAt`. `$other: { .validate: false }` sur tout nœud client. | Bloquant : `clientTs` falsifiable → score max gratuit ; champs arbitraires (`awarded`) injectables. |
| **D4** | **Sharding partout** : `/sessions/{sessionId}/answers/{questionId}/{shardId}/{uid}`, `shardId = hash(uid)%20`, **appliqué dans les Rules aussi**. | Bloquant : sharding annoncé en 1.5 mais absent du code/Rules → point chaud, fan-in qui frôle ~1000 writes/s. |
| **D5** | **Scoring découplé de la soumission.** La soumission n'écrit que la réponse brute. Au **REVEAL**, la Function `closeQuestion` lit tous les shards, calcule les scores en **une passe déterministe & idempotente**, écrit `scores`+`leaderboard` en **multi-path update atomique**. `awarded`/`correct`/`responseTimeMs` ne sont **jamais** dans `/answers`. | Bloquant + majeur : double write-rate (2 transactions/réponse) ; déconnexion en vol → réponse sans score ; leaderboard faux non détecté. |
| **D6** | **`answeredCount` (jauge X/N) non écrit par réponse** : soit dérivé au REVEAL, soit **sharded counter** RTDB (N compteurs, somme en lecture). **Throttle/debounce serveur** du leaderboard live (pas de fan-out continu du top complet). | Majeur : Rules ne peuvent pas agréger ; doc chaud single-node ; fan-out continu = coût ×10–50. |
| **D7** | **PIN = 8 chiffres (10⁸)** ou base32 6 car. (~10⁹). `joinSession` rate-limité par **App Check** + compteur `/joinAttempts/{pin}` (verrou **par PIN** après N échecs globaux). App Check **obligatoire** avant `joinSession`. | Majeur : 6 chiffres → densité de collision élevée à l'échelle ; rate-limit par `uid` inopérant (auth anonyme illimitée). |
| **D8** | **Rupture de stack assumée** : mister-qowa introduit Firebase **Auth (anonyme+Google), Firestore, Functions, Storage, App Check** — **absents de mister-puzzle** (RTDB seul, sans auth). Ce n'est **pas** une continuité parc. Le `RateLimiter` client = **UX seulement** (anti double-clic), jamais une défense serveur. Rate-limit autoritaire = compteur RTDB transactionnel + App Check + quotas Functions. | Majeur : le dossier présentait à tort l'auth comme « repris du parc » ; RateLimiter client cité comme sécurité (trompeur). |
| **D9** | **Contrats zod uniques** = package **`@mister-qowa/contracts`** (frontière de confiance). Littéraux de type figés : **`'multiple_choice' \| 'true_false' \| 'free_text' \| 'poll'`**. Une seule forme `SubmitAnswer`. `normalizeFreeText` centralisée (client+Functions), respecte `caseSensitive`. **Ne pas hasher** les réponses libres « pour la sécurité » (faux sens) : ne jamais exposer `/answers`. | Majeur : ≥4 jeux de littéraux divergents (`mcq`/`multiple`/`multiple_choice`) → payloads rejetés ; normalisation dupliquée ; `caseSensitive` ignoré. |
| **D10** | **Streak unique** dans `engine/scoring.ts` (source de vérité **importée** par les Functions, pas redéfinie), **avec cap** : `mult = 1 + (streakBonusPct/100) * min(max(streak,0), STREAK_CAP)`, `STREAK_CAP=5`. Tableau d'exemples recalculé + test asserant chaque ligne. | Majeur : 4 formules divergentes (cap 5 vs sans cap) → 1500 vs 2000 pts pour le même scénario. |
| **D11** | **Export CSV `exportResults`** : vérifie l'ID token (`admin.auth().verifyIdToken`) + `uid === ownerId`, sinon **403**. Jamais livré sans auth. | Mineur (mais fuite RGPD) : auth « omise pour lisibilité » sur le seul endpoint qui sort des données perso en masse. |
| **D12** | **Abonnements client étroits** : le joueur n'écoute que `state`, `current`, `leaderboard/top` — **jamais** l'arbre complet (`players`). Abonnement complet réservé Host/Big-screen. `useGameSession` corrigé. | Mineur : `useGameSession` écoutait `games/{pin}` entier (1000+ joueurs) → re-télécharge/re-valide tout à chaque mutation, viole la s.1.5. |

### Périmètre MVP (écart vs brief, assumé)

La brief exige 4 types + médias en *features obligatoires*. **Écart volontaire** : le MVP valide d'abord la **boucle live**.

- **MVP** : live + **QCM + vrai/faux**, lobby PIN, scoring autoritaire (vitesse+justesse), leaderboard live, podium, feedback. **`endGame` + snapshot Firestore `results/{gameId}` inclus dès le MVP** (persistance immédiate, pour ne pas perdre l'historique). Auth anonyme + App Check + émulateurs câblés.
- **V1** : `free_text` + `poll`, **médias** (Storage), mode **async/solo**, **analytics** (par joueur/question) + **export CSV**, streak, comptes host Google, banque de questions.
- **V2** : mode **équipe** complet (entité `teams {teamId, sessionId, name, color}` + endpoints), **génération IA**, **tournoi**, réactions emoji à l'échelle, et bascule **self-hosted** (NestJS + Socket.io + PostgreSQL + Redis) si le coût/concurrence Firebase l'impose.

Tout élément hors-MVP est tagué **[V1]/[V2]** dans les wireframes (s.5) et la roadmap (s.8).

### Chiffres réalistes (corrigés)

- **Scalabilité** : 1 session de 1000 joueurs est **à la limite d'une instance RTDB** (~1000 writes/s sustained). Le sharding (D4) + le découplage scoring (D5) gardent la marge. **Multi-instance/base dès qu'il y a plusieurs sessions concurrentes** (pas en V2).
- **Coût** : **~0,50–2 $/session de 1000 joueurs** (et non 0,05 $) — RTDB facture connexions simultanées + temps connecté + download de chaque nœud abonné fan-outé ; min-instances Functions ≥1 facturé H24 (hors free tier).
