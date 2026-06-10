/** Dictionnaire FRANÇAIS — source de vérité des clés (voir en.ts pour la parité). */
import type { Msg } from "./types";

const frPlural = (n: number) => (Number(n) > 1 ? "s" : "");

export const fr = {
  // commun
  "common.home": "Accueil",
  "common.back": "Retour",
  "common.cancel": "Annuler",
  "common.confirm": "Confirmer",
  "common.reload": "Recharger",
  "common.toHome": "Retour à l’accueil",
  "common.notFound": "Partie introuvable",
  "common.sessionGone": "Cette partie n’existe plus ou a été fermée.",
  "common.connecting": "Connexion…",
  "common.pts": (v) => `${v.n} pts`,
  "common.questionN": (v) => `Question ${v.n}/${v.total}`,
  "common.ordinal": (v) => `${v.n}${Number(v.n) === 1 ? "er" : "e"}`,

  // accueil
  "home.subtitle":
    "Quiz interactifs en temps réel. Réponds vite, grimpe au classement.",
  "home.resume": "Reprendre la partie",
  "home.quit": "Quitter cette partie",
  "home.host": "Héberger un quiz",
  "home.join": "Rejoindre une partie",
  "home.solo": "Jouer en solo",
  "home.myGames": "Mes parties",

  // profil joueur (local)
  "profile.summary": (v) =>
    `${v.games} partie${frPlural(Number(v.games))} · ${v.points} pts`,
  "profile.badge.firstGame": "Première partie",
  "profile.badge.podium": "Podium",
  "profile.badge.win": "Victoire",
  "profile.badge.veteran": "Vétéran",

  // pied de page
  "footer.source": "Code source",
  "footer.support": "Soutenir",
  "footer.reload": "Recharger",
  "footer.soundOn": "Son activé",
  "footer.soundOff": "Son coupé",
  "footer.muteAria": "Couper le son",
  "footer.unmuteAria": "Activer le son",
  "footer.langAria": "Langue",

  // bibliothèque / création
  "create.title": "Quiz",
  "create.importAria": "Importer un quiz",
  "create.aiAria": "Générer un quiz par IA",
  "create.new": "Nouveau",
  "create.searchPlaceholder": "Rechercher un quiz…",
  "create.sortRecent": "Récents",
  "create.sortAz": "A→Z",
  "create.teamMode": "Mode équipe",
  "create.teamsCountAria": "Nombre d’équipes",
  "create.teamsOption": (v) => `${v.n} équipes`,
  "create.eliminationMode": "Mode élimination",
  "create.myQuizzes": "Mes quiz",
  "create.questionsCount": (v) => `${v.n} question${frPlural(Number(v.n))}`,
  "create.launch": "Lancer",
  "create.editAria": "Modifier",
  "create.duplicateAria": "Dupliquer",
  "create.exportAria": "Exporter",
  "create.deleteAria": "Supprimer",
  "create.demoQuizzes": "Quiz de démo",
  "create.copyToMineAria": "Copier dans mes quiz pour l’éditer",
  "create.creating": "Création de la partie…",
  "create.deleteTitle": (v) => `Supprimer « ${v.title} » ?`,
  "create.deleteMsg": "Cette action est définitive.",
  "create.duplicateExists": (v) =>
    `« ${v.title} » est déjà dans ta bibliothèque.`,

  // éditeur de quiz
  "editor.cancel": "Annuler",
  "editor.titleNew": "Nouveau quiz",
  "editor.titleEdit": "Modifier le quiz",
  "editor.titlePlaceholder": "Titre du quiz",
  "editor.descPlaceholder": "Description (optionnelle)",
  "editor.addQuestion": "Ajouter une question",
  "editor.save": "Enregistrer le quiz",

  // éditeur de question
  "qe.typeMultipleChoice": "Choix multiple",
  "qe.typeTrueFalse": "Vrai / Faux",
  "qe.typeFreeText": "Réponse libre",
  "qe.typePoll": "Sondage (sans bonne réponse)",
  "qe.questionN": (v) => `Question ${v.n}`,
  "qe.moveUp": "Monter",
  "qe.moveDown": "Descendre",
  "qe.removeQuestion": "Supprimer la question",
  "qe.typeAria": "Type de question",
  "qe.promptAria": (v) => `Énoncé de la question ${v.n}`,
  "qe.promptPlaceholder": "Énoncé de la question",
  "qe.removeImage": "Retirer l’image",
  "qe.addImage": "Ajouter une image",
  "qe.uploading": "Envoi…",
  "qe.mediaAltPlaceholder": "Description de l’image (lecteurs d’écran)",
  "qe.mediaAltAria": (v) => `Description de l’image de la question ${v.n}`,
  "qe.mediaAltHint":
    "Décris l’image sans révéler la réponse (visible des joueurs malvoyants).",
  "qe.correctAnswerAria": "Bonne réponse",
  "qe.answerN": (v) => `Réponse ${v.n}`,
  "qe.removeOption": "Retirer l’option",
  "qe.addOption": "Ajouter une option",
  "qe.correctHint": "Coche le rond vert à gauche de la bonne réponse.",
  "qe.true": "Vrai",
  "qe.false": "Faux",
  "qe.acceptedAnswerN": (v) => `Réponse acceptée ${v.n}`,
  "qe.remove": "Retirer",
  "qe.addAcceptedAnswer": "Autre réponse acceptée",
  "qe.caseSensitive": "Sensible à la casse",
  "qe.explanationPlaceholder": "Explication de la réponse (optionnelle)",
  "qe.explanationAria": (v) => `Explication de la question ${v.n}`,
  "qe.time": "Temps",
  "qe.points": "Points",
  "qe.seconds": (v) => `${v.n}s`,

  // génération IA
  "ai.editParams": "Modifier les paramètres",
  "ai.title": "Générer par IA",
  "ai.subtitle":
    "Décris un sujet (ou colle un texte). L’IA propose un quiz que tu pourras relire et modifier avant de l’enregistrer.",
  "ai.topic": "Sujet",
  "ai.topicAria": "Sujet du quiz",
  "ai.topicPlaceholder": "Ex : la mythologie grecque, les capitales d’Europe…",
  "ai.fromText": "…ou à partir d’un texte (optionnel)",
  "ai.sourceTextAria": "Texte source",
  "ai.sourceTextPlaceholder": "Colle ici un cours, un article, un résumé…",
  "ai.questions": "Questions",
  "ai.questionsAria": "Nombre de questions",
  "ai.difficulty": "Difficulté",
  "ai.diffFacile": "facile",
  "ai.diffMoyen": "moyen",
  "ai.diffDifficile": "difficile",
  "ai.language": "Langue",
  "ai.generate": "Générer le quiz",
  "ai.tryDemo": "Essayer en mode démo (sans clé)",
  "ai.generating": "Génération en cours…",
  "ai.previewSub": (v) =>
    `${v.n} question${frPlural(Number(v.n))} — relis puis ouvre dans l’éditeur.`,
  "ai.regenAria": (v) => `Régénérer la question ${v.n}`,
  "ai.openEditor": "Ouvrir dans l’éditeur",
  "ai.apiKey": "Ta clé API",
  "ai.keyPlaceholder": (v) => `Clé ${v.provider}`,
  "ai.apiKeyAria": "Clé API",
  "ai.modelPlaceholder": (v) => `Modèle (défaut : ${v.model})`,
  "ai.modelAria": "Modèle (optionnel)",
  "ai.modelUsed": (v) =>
    `Modèle utilisé : ${v.model}. La clé reste dans ton navigateur (jamais envoyée à nos serveurs) et part directement chez ${v.provider}.`,
  "ai.getKey": (v) => `Obtenir une clé — ${v.label}`,
  "ai.errNoTopic": "Indique un sujet ou colle un texte source.",
  "ai.errNoKey": "Renseigne ta clé API plus bas.",

  // rejoindre
  "join.title": "Rejoindre une partie",
  "join.pickTeam": (v) => `Choisis ton équipe, ${v.pseudo} :`,
  "join.pinLabel": "Code PIN",
  "join.pinAria": (v) => `Code PIN, ${v.n} sur ${v.total} chiffres`,
  "join.pseudoLabel": "Ton pseudo",
  "join.pseudoPlaceholder": "Alex",
  "join.avatarLabel": "Ton avatar",
  "join.avatarAria": (v) => `Avatar ${v.a}`,
  "join.submit": "Entrer dans la partie",

  // joueur (Play)
  "play.kicked": "Tu as été retiré",
  "play.kickedMsg": "L’hôte t’a exclu de cette partie.",
  "play.welcome": (v) => `Bienvenue ${v.pseudo} !`,
  "play.waiting": "En attente du lancement par l’hôte…",
  "play.pauseBadge": "⏸ Pause",
  "play.eliminated": "💀 Éliminé",
  "play.eliminatedMsg":
    "Tu continues en spectateur — bonne chance aux survivants !",
  "play.answerPlaceholder": "Ta réponse…",
  "play.send": "Envoyer",
  "play.sent": "Réponse envoyée ✓ — attends le résultat…",
  "play.voteThanks": "Merci pour ton vote 🗳️",
  "play.correct": "Bonne réponse !",
  "play.wrong": "Raté !",
  "play.noAnswer": "Pas de réponse",
  "play.zeroPt": "+0 pt",
  "play.awarded": (v) => `+${v.n} pts`,
  "play.results": "Résultats…",
  "play.expectedAnswer": (v) => `Réponse attendue : « ${v.answer} »`,
  "play.rankLine": (v) => `Tu es ${v.rank} · ${v.pts} pts`,
  "play.podiumRank": (v) => `Tu finis ${v.rank} ! 🎉`,
  "play.quit": "Quitter",

  // hôte (Host)
  "host.connecting": "Connexion à la partie…",
  "host.quizLostTitle": "Quiz indisponible sur cet appareil",
  "host.quizLostBody":
    "Le quiz hébergé n’est pas dans la bibliothèque de cet appareil (mémoire effacée ou autre navigateur). Clôture la salle pour libérer le PIN.",
  "host.closeRoom": "Clôturer la salle",
  "host.linkCopied": "Lien copié !",
  "host.shareUnavailable": "Partage indisponible",
  "host.inviteText": "Rejoins ma partie de quiz !",
  "host.resultTitle": "Résultats Mister Qowa",
  "host.playersConnected": (v) =>
    `${v.n} joueur${frPlural(Number(v.n))} connecté${frPlural(Number(v.n))}`,
  "host.kickAria": (v) => `Exclure ${v.pseudo}`,
  "host.invite": "Inviter",
  "host.start": "Démarrer la partie",
  "host.pause": "Pause",
  "host.resume": "Reprendre",
  "host.replay": "Re-poser",
  "host.skip": "Passer",
  "host.closeNow": "Clore maintenant",
  "host.answered": (v) => `${v.count}/${v.total} ont répondu`,
  "host.inPlaySuffix": (v) => ` · 💀 ${v.n} en lice`,
  "host.leaderboardTitle": "Classement",
  "leaderboard.empty": "Personne pour l’instant…",
  "host.survivorsLine": (v) =>
    `💀 ${v.n} joueur${frPlural(Number(v.n))} encore en lice`,
  "host.nextQuestion": "Question suivante",
  "host.endPodium": "Terminer & podium",
  "host.podiumTitle": "Podium 🎉",
  "host.replayWithSame": "Rejouer avec les mêmes",
  "host.shareResult": "Partager le résultat",
  "host.newGame": "Nouvelle partie",

  // solo
  "solo.changeQuiz": "Changer de quiz",
  "solo.title": "Jouer en solo",
  "solo.play": "Jouer",
  "solo.finished": "Terminé ! 🎉",
  "solo.replay": "Rejouer",
  "solo.otherQuiz": "Autre quiz",
  "solo.answerPlaceholder": "Ta réponse…",
  "solo.answerAria": "Ta réponse",
  "solo.validate": "Valider",
  "solo.voteRecorded": "Vote enregistré 🗳️",
  "solo.timeUp": "Temps écoulé !",
  "solo.correct": "Bonne réponse !",
  "solo.wrong": "Raté !",
  "solo.next": "Suivant",
  "solo.seeScore": "Voir le score",
  "solo.secondsShort": (v) => `${v.n}s`,

  // historique
  "history.title": "Mes parties",
  "history.loading": "Chargement de l’historique…",
  "history.empty":
    "Aucune partie terminée pour l’instant. Lance un quiz et termine-le pour le voir ici !",
  "history.byQuiz": "Par quiz",
  "history.aggLine": (v) =>
    `${v.games} partie${frPlural(Number(v.games))} · moy. ${v.avg} · record ${v.best}`,
  "history.gameSub": (v) =>
    `${v.date} · ${v.players} joueur${frPlural(Number(v.players))}`,
  "history.winnerLine": (v) => `${v.pseudo} · ${v.pts} pts`,
  "history.hardest": (v) =>
    `Plus ratée : « ${v.prompt} » — ${v.pct}% de réussite`,

  // réactions / divers composants
  "reactions.sendAria": (v) => `Envoyer la réaction ${v.emoji}`,
  "countdown.aria": (v) => `${v.n} secondes restantes`,
  "connection.offline": "Hors ligne — reconnexion…",
  "pin.label": "Code PIN",
  "update.available": "Nouvelle version disponible",
  "update.later": "Plus tard",
  "install.prompt": "Installer Mister Qowa sur ton appareil ?",
  "install.action": "Installer",

  // erreurs
  "err.generic": "Une erreur est survenue.",
  "err.crashTitle": "Oups…",
  "err.crashBody":
    "Une erreur est survenue. Recharge l’application pour repartir.",
  "err.configTitle": "Service indisponible",
  "err.appCheckMissing":
    "La protection anti-robot (App Check) n’est pas configurée pour cette mise en ligne. Contacte l’organisateur.",
  // session / partie (api)
  "err.pinAllocFailed": "Impossible d’allouer un PIN.",
  "err.noMoreQuestions": "Plus de questions.",
  "err.pinInvalid": "PIN invalide.",
  "err.gameStarted": "La partie a déjà commencé.",
  "err.youAreBanned": "Tu as été retiré de cette partie.",
  "err.gameFull": "Partie complète.",
  // médias / import
  "err.pickImage": "Choisis une image.",
  "err.imageTooHeavy": "Image trop lourde même compressée (max 3 Mo).",
  "err.fileUnreadable": "Fichier illisible (JSON invalide).",
  "err.notAQuiz": "Ce fichier n’est pas un quiz valide.",
  // IA
  "err.aiNoKey": "Renseigne d’abord ta clé API.",
  "err.aiUnreadable": "Réponse IA illisible (JSON introuvable).",
  "err.aiNoContent": (v) => `${v.provider} n’a renvoyé aucun contenu.`,
  "err.aiKeyRejected": (v) =>
    `Clé ${v.provider} refusée (vérifie qu’elle est valide et active).`,
  "err.aiQuota": (v) => `Quota ${v.provider} dépassé — réessaie plus tard.`,
  "err.aiStatus": (v) =>
    `${v.provider} a répondu ${v.status}${v.detail ? ` : ${v.detail}` : ""}.`,
  "err.aiTimeout": "La génération a expiré — réessaie.",
  "err.aiNetwork": "Connexion au fournisseur impossible (réseau ou CORS).",
  "err.aiBadFormat": "L’IA a produit un quiz au mauvais format — réessaie.",
  "err.aiRegenFailed": "Régénération impossible — réessaie.",
  "err.aiInvalidQuiz": "Quiz généré invalide — réessaie.",
  // validation de quiz (éditeur)
  "err.vTitle": "Donne un titre au quiz.",
  "err.vAtLeastOneQuestion": "Ajoute au moins une question.",
  "err.vEmptyPrompt": (v) => `Q${v.n} : l’énoncé est vide.`,
  "err.vFillTwoOptions": (v) =>
    `Q${v.n} : remplis au moins 2 réponses (certaines sont vides).`,
  "err.vAtLeastTwoOptions": (v) => `Q${v.n} : il faut au moins 2 réponses.`,
  "err.vDuplicateOptions": (v) => `Q${v.n} : deux réponses sont identiques.`,
  "err.vDuplicateOptionIds": (v) =>
    `Q${v.n} : identifiants de réponse en double.`,
  "err.vSelectCorrect": (v) => `Q${v.n} : sélectionne la bonne réponse.`,
  "err.vAtLeastOneAccepted": (v) =>
    `Q${v.n} : ajoute au moins une réponse acceptée.`,
} satisfies Record<string, Msg>;

export type Key = keyof typeof fr;
