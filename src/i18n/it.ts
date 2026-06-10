/** Dictionnaire ITALIEN — parité des clés imposée par le typage. */
import type { Msg } from "./types";
import type { Key } from "./fr";

const ae = (n: number) => (Number(n) === 1 ? "a" : "e"); // domanda/partita/squadra
const ei = (n: number) => (Number(n) === 1 ? "e" : "i"); // giocatore → giocatori
const oi = (n: number) => (Number(n) === 1 ? "o" : "i"); // connesso → connessi

export const it = {
  // comune
  "common.home": "Inizio",
  "common.back": "Indietro",
  "common.cancel": "Annulla",
  "common.confirm": "Conferma",
  "common.reload": "Ricarica",
  "common.toHome": "Torna alla home",
  "common.notFound": "Partita non trovata",
  "common.sessionGone": "Questa partita non esiste più o è stata chiusa.",
  "common.connecting": "Connessione…",
  "common.pts": (v) => `${v.n} pt`,
  "common.questionN": (v) => `Domanda ${v.n}/${v.total}`,
  "common.ordinal": (v) => `${v.n}º`,

  // inizio
  "home.subtitle":
    "Quiz interattivi in tempo reale. Rispondi veloce, scala la classifica.",
  "home.resume": "Riprendi la partita",
  "home.quit": "Esci da questa partita",
  "home.host": "Ospita un quiz",
  "home.join": "Unisciti a una partita",
  "home.solo": "Gioca in solitario",
  "home.myGames": "Le mie partite",

  // profilo giocatore (locale)
  "profile.summary": (v) =>
    `${v.games} partit${Number(v.games) === 1 ? "a" : "e"} · ${v.points} pts`,
  "profile.badge.firstGame": "Prima partita",
  "profile.badge.podium": "Podio",
  "profile.badge.win": "Vittoria",
  "profile.badge.veteran": "Veterano",

  // importa da testo + condividi punteggio
  "create.textImportAria": "Importa da testo",
  "textImport.title": "Importa da testo",
  "textImport.help":
    "Una domanda per riga, campi separati da «;»:\n• Scelta multipla: Domanda ; *Corretta ; Sbagliata ; Sbagliata\n• Vero/Falso: Domanda ; V (o F)\n• Testo libero: Domanda ; =risposta accettata\n• Sondaggio: Domanda ; Opzione A ; Opzione B",
  "textImport.titlePlaceholder": "Titolo del quiz",
  "textImport.placeholder":
    "Capitale della Francia ; *Parigi ; Lione ; Marsiglia\nLa Terra è piatta ; F\nOceano più grande ; =Pacifico",
  "textImport.action": "Importa",
  "textImport.defaultTitle": "Quiz importato",
  "play.shareScore": "Condividi il mio punteggio",
  "play.shareScoreText": (v) =>
    `Ho finito ${v.rank} con ${v.pts} punti su Mister Qowa!`,
  "solo.bestStreak": (v) => `Miglior serie: ${v.n} 🔥`,
  "solo.shareText": (v) => `${v.score} punti in solo su Mister Qowa!`,

  // piè di pagina
  "footer.source": "Codice sorgente",
  "footer.support": "Sostieni",
  "footer.reload": "Ricarica",
  "footer.soundOn": "Audio attivo",
  "footer.soundOff": "Audio disattivato",
  "footer.muteAria": "Disattiva l'audio",
  "footer.unmuteAria": "Attiva l'audio",
  "footer.langAria": "Lingua",

  // libreria / creazione
  "create.title": "Quiz",
  "create.importAria": "Importa un quiz",
  "create.aiAria": "Genera un quiz con l'IA",
  "create.new": "Nuovo",
  "create.searchPlaceholder": "Cerca un quiz…",
  "create.sortRecent": "Recenti",
  "create.sortAz": "A→Z",
  "create.teamMode": "Modalità squadre",
  "create.teamsCountAria": "Numero di squadre",
  "create.teamsOption": (v) => `${v.n} squadre`,
  "create.eliminationMode": "Modalità eliminazione",
  "create.myQuizzes": "I miei quiz",
  "create.questionsCount": (v) => `${v.n} domand${ae(Number(v.n))}`,
  "create.launch": "Avvia",
  "create.editAria": "Modifica",
  "create.duplicateAria": "Duplica",
  "create.exportAria": "Esporta",
  "create.deleteAria": "Elimina",
  "create.demoQuizzes": "Quiz dimostrativi",
  "create.copyToMineAria": "Copia nei miei quiz per modificarlo",
  "create.creating": "Creazione della partita…",
  "create.deleteTitle": (v) => `Eliminare «${v.title}»?`,
  "create.deleteMsg": "Questa azione è definitiva.",
  "create.duplicateExists": (v) => `«${v.title}» è già nella tua libreria.`,

  // editor del quiz
  "editor.cancel": "Annulla",
  "editor.titleNew": "Nuovo quiz",
  "editor.titleEdit": "Modifica quiz",
  "editor.titlePlaceholder": "Titolo del quiz",
  "editor.descPlaceholder": "Descrizione (facoltativa)",
  "editor.addQuestion": "Aggiungi una domanda",
  "editor.save": "Salva quiz",

  // editor della domanda
  "qe.typeMultipleChoice": "Scelta multipla",
  "qe.typeTrueFalse": "Vero / Falso",
  "qe.typeFreeText": "Testo libero",
  "qe.typePoll": "Sondaggio (senza risposta corretta)",
  "qe.questionN": (v) => `Domanda ${v.n}`,
  "qe.moveUp": "Sposta su",
  "qe.moveDown": "Sposta giù",
  "qe.removeQuestion": "Rimuovi domanda",
  "qe.typeAria": "Tipo di domanda",
  "qe.promptAria": (v) => `Testo della domanda ${v.n}`,
  "qe.promptPlaceholder": "Testo della domanda",
  "qe.removeImage": "Rimuovi l'immagine",
  "qe.addImage": "Aggiungi un'immagine",
  "qe.uploading": "Caricamento…",
  "qe.mediaAltPlaceholder": "Descrizione dell'immagine (screen reader)",
  "qe.mediaAltAria": (v) => `Descrizione dell'immagine della domanda ${v.n}`,
  "qe.mediaAltHint":
    "Descrivi l'immagine senza rivelare la risposta (letta dai giocatori non vedenti).",
  "qe.correctAnswerAria": "Risposta corretta",
  "qe.answerN": (v) => `Risposta ${v.n}`,
  "qe.removeOption": "Rimuovi l'opzione",
  "qe.addOption": "Aggiungi un'opzione",
  "qe.correctHint": "Spunta il cerchio verde accanto alla risposta corretta.",
  "qe.true": "Vero",
  "qe.false": "Falso",
  "qe.acceptedAnswerN": (v) => `Risposta accettata ${v.n}`,
  "qe.remove": "Rimuovi",
  "qe.addAcceptedAnswer": "Altra risposta accettata",
  "qe.caseSensitive": "Distingui maiuscole",
  "qe.explanationPlaceholder": "Spiegazione della risposta (facoltativa)",
  "qe.explanationAria": (v) => `Spiegazione della domanda ${v.n}`,
  "qe.time": "Tempo",
  "qe.points": "Punti",
  "qe.seconds": (v) => `${v.n}s`,

  // generazione con IA
  "ai.editParams": "Modifica le impostazioni",
  "ai.title": "Genera con l'IA",
  "ai.subtitle":
    "Descrivi un argomento (o incolla un testo). L'IA propone un quiz che potrai rivedere e modificare prima di salvare.",
  "ai.topic": "Argomento",
  "ai.topicAria": "Argomento del quiz",
  "ai.topicPlaceholder": "Es.: la mitologia greca, le capitali d'Europa…",
  "ai.fromText": "…o da un testo (facoltativo)",
  "ai.sourceTextAria": "Testo sorgente",
  "ai.sourceTextPlaceholder":
    "Incolla qui una lezione, un articolo, un riassunto…",
  "ai.questions": "Domande",
  "ai.questionsAria": "Numero di domande",
  "ai.difficulty": "Difficoltà",
  "ai.diffFacile": "facile",
  "ai.diffMoyen": "media",
  "ai.diffDifficile": "difficile",
  "ai.language": "Lingua",
  "ai.generate": "Genera quiz",
  "ai.tryDemo": "Prova la modalità demo (senza chiave)",
  "ai.generating": "Generazione…",
  "ai.previewSub": (v) =>
    `${v.n} domand${ae(Number(v.n))} — rivedi e poi apri nell'editor.`,
  "ai.regenAria": (v) => `Rigenera la domanda ${v.n}`,
  "ai.openEditor": "Apri nell'editor",
  "ai.apiKey": "La tua chiave API",
  "ai.keyPlaceholder": (v) => `Chiave ${v.provider}`,
  "ai.apiKeyAria": "Chiave API",
  "ai.modelPlaceholder": (v) => `Modello (predefinito: ${v.model})`,
  "ai.modelAria": "Modello (facoltativo)",
  "ai.modelUsed": (v) =>
    `Modello usato: ${v.model}. La chiave resta nel tuo browser (mai inviata ai nostri server) e va direttamente a ${v.provider}.`,
  "ai.getKey": (v) => `Ottieni una chiave — ${v.label}`,
  "ai.errNoTopic": "Indica un argomento o incolla un testo sorgente.",
  "ai.errNoKey": "Inserisci la tua chiave API qui sotto.",

  // unisciti
  "join.title": "Unisciti a una partita",
  "join.pickTeam": (v) => `Scegli la tua squadra, ${v.pseudo}:`,
  "join.pinLabel": "Codice PIN",
  "join.pinAria": (v) => `Codice PIN, ${v.n} di ${v.total} cifre`,
  "join.pseudoLabel": "Il tuo soprannome",
  "join.pseudoPlaceholder": "Alex",
  "join.avatarLabel": "Il tuo avatar",
  "join.avatarAria": (v) => `Avatar ${v.a}`,
  "join.submit": "Entra nella partita",

  // giocatore (Play)
  "play.kicked": "Sei stato rimosso",
  "play.kickedMsg": "L'host ti ha rimosso da questa partita.",
  "play.welcome": (v) => `Benvenuto ${v.pseudo}!`,
  "play.waiting": "In attesa che l'host inizi…",
  "play.pauseBadge": "⏸ Pausa",
  "play.eliminated": "💀 Eliminato",
  "play.eliminatedMsg":
    "Resti come spettatore — buona fortuna ai sopravvissuti!",
  "play.answerPlaceholder": "La tua risposta…",
  "play.send": "Invia",
  "play.sent": "Risposta inviata ✓ — attendi il risultato…",
  "play.voteThanks": "Grazie per il tuo voto 🗳️",
  "play.correct": "Giusto!",
  "play.wrong": "Sbagliato!",
  "play.noAnswer": "Nessuna risposta",
  "play.zeroPt": "+0 pt",
  "play.awarded": (v) => `+${v.n} pt`,
  "play.results": "Risultati…",
  "play.expectedAnswer": (v) => `Risposta attesa: «${v.answer}»`,
  "play.rankLine": (v) => `Sei ${v.rank} · ${v.pts} pt`,
  "play.podiumRank": (v) => `Arrivi ${v.rank}! 🎉`,
  "play.quit": "Esci",

  // host
  "host.connecting": "Connessione alla partita…",
  "host.quizLostTitle": "Quiz non disponibile su questo dispositivo",
  "host.quizLostBody":
    "Il quiz ospitato non è nella libreria di questo dispositivo (memoria cancellata o browser diverso). Chiudi la stanza per liberare il PIN.",
  "host.closeRoom": "Chiudi la stanza",
  "host.linkCopied": "Link copiato!",
  "host.shareUnavailable": "Condivisione non disponibile",
  "host.inviteText": "Unisciti alla mia partita di quiz!",
  "host.resultTitle": "Risultati di Mister Qowa",
  "host.playersConnected": (v) =>
    `${v.n} giocator${ei(Number(v.n))} conness${oi(Number(v.n))}`,
  "host.kickAria": (v) => `Rimuovi ${v.pseudo}`,
  "host.invite": "Invita",
  "host.start": "Avvia la partita",
  "host.pause": "Pausa",
  "host.resume": "Riprendi",
  "host.replay": "Riproponi",
  "host.skip": "Salta",
  "host.closeNow": "Chiudi ora",
  "host.answered": (v) => `${v.count}/${v.total} hanno risposto`,
  "host.inPlaySuffix": (v) => ` · 💀 ${v.n} in gioco`,
  "host.leaderboardTitle": "Classifica",
  "host.survivorsLine": (v) =>
    `💀 ${v.n} giocator${ei(Number(v.n))} ancora in gioco`,
  "host.nextQuestion": "Domanda successiva",
  "host.endPodium": "Termina e podio",
  "host.podiumTitle": "Podio 🎉",
  "host.replayWithSame": "Rigioca con gli stessi",
  "host.shareResult": "Condividi il risultato",
  "host.newGame": "Nuova partita",

  // solo
  "solo.changeQuiz": "Cambia quiz",
  "solo.title": "Gioca in solitario",
  "solo.play": "Gioca",
  "solo.finished": "Finito! 🎉",
  "solo.replay": "Rigioca",
  "solo.otherQuiz": "Altro quiz",
  "solo.answerPlaceholder": "La tua risposta…",
  "solo.answerAria": "La tua risposta",
  "solo.validate": "Conferma",
  "solo.voteRecorded": "Voto registrato 🗳️",
  "solo.timeUp": "Tempo scaduto!",
  "solo.correct": "Giusto!",
  "solo.wrong": "Sbagliato!",
  "solo.next": "Avanti",
  "solo.seeScore": "Vedi il punteggio",
  "solo.secondsShort": (v) => `${v.n}s`,

  // cronologia
  "history.title": "Le mie partite",
  "history.loading": "Caricamento della cronologia…",
  "history.empty":
    "Ancora nessuna partita terminata. Avvia un quiz e terminalo per vederlo qui!",
  "history.byQuiz": "Per quiz",
  "history.aggLine": (v) =>
    `${v.games} partit${ae(Number(v.games))} · media ${v.avg} · record ${v.best}`,
  "history.gameSub": (v) =>
    `${v.date} · ${v.players} giocator${ei(Number(v.players))}`,
  "history.winnerLine": (v) => `${v.pseudo} · ${v.pts} pt`,
  "history.hardest": (v) =>
    `Più sbagliata: «${v.prompt}» — ${v.pct}% di risposte corrette`,

  // reazioni / varie
  "reactions.sendAria": (v) => `Invia la reazione ${v.emoji}`,
  "countdown.aria": (v) => `${v.n} secondi rimasti`,
  "connection.offline": "Offline — riconnessione…",
  "pin.label": "Codice PIN",
  "update.available": "Nuova versione disponibile",
  "update.later": "Più tardi",
  "install.prompt": "Installare Mister Qowa sul tuo dispositivo?",
  "install.action": "Installa",
  "leaderboard.empty": "Ancora nessuno…",

  // errori
  "err.generic": "Si è verificato un errore.",
  "err.crashTitle": "Ops…",
  "err.crashBody": "Si è verificato un errore. Ricarica l'app per continuare.",
  "err.configTitle": "Servizio non disponibile",
  "err.appCheckMissing":
    "La protezione anti-bot (App Check) non è configurata per questa pubblicazione. Contatta l'organizzatore.",
  "err.pinAllocFailed": "Impossibile assegnare un PIN.",
  "err.noMoreQuestions": "Nessun'altra domanda.",
  "err.pinInvalid": "PIN non valido.",
  "err.gameStarted": "La partita è già iniziata.",
  "err.youAreBanned": "Sei stato rimosso da questa partita.",
  "err.gameFull": "Partita al completo.",
  "err.pickImage": "Scegli un'immagine.",
  "err.imageTooHeavy": "Immagine troppo pesante anche compressa (max 3 MB).",
  "err.fileUnreadable": "File illeggibile (JSON non valido).",
  "err.notAQuiz": "Questo file non è un quiz valido.",
  "err.aiNoKey": "Inserisci prima la tua chiave API.",
  "err.aiUnreadable": "Risposta IA illeggibile (nessun JSON trovato).",
  "err.aiNoContent": (v) => `${v.provider} non ha restituito alcun contenuto.`,
  "err.aiKeyRejected": (v) =>
    `Chiave ${v.provider} rifiutata (verifica che sia valida e attiva).`,
  "err.aiQuota": (v) => `Quota ${v.provider} superata — riprova più tardi.`,
  "err.aiStatus": (v) =>
    `${v.provider} ha risposto ${v.status}${v.detail ? `: ${v.detail}` : ""}.`,
  "err.aiTimeout": "Generazione scaduta — riprova.",
  "err.aiNetwork": "Impossibile contattare il provider (rete o CORS).",
  "err.aiBadFormat": "L'IA ha prodotto un quiz malformato — riprova.",
  "err.aiRegenFailed": "Rigenerazione non riuscita — riprova.",
  "err.aiInvalidQuiz": "Quiz generato non valido — riprova.",
  "err.vTitle": "Dai un titolo al quiz.",
  "err.vAtLeastOneQuestion": "Aggiungi almeno una domanda.",
  "err.vEmptyPrompt": (v) => `D${v.n}: il testo è vuoto.`,
  "err.vFillTwoOptions": (v) =>
    `D${v.n}: compila almeno 2 risposte (alcune sono vuote).`,
  "err.vAtLeastTwoOptions": (v) => `D${v.n}: servono almeno 2 risposte.`,
  "err.vDuplicateOptions": (v) => `D${v.n}: due risposte sono identiche.`,
  "err.vDuplicateOptionIds": (v) =>
    `D${v.n}: identificatori di risposta duplicati.`,
  "err.vSelectCorrect": (v) => `D${v.n}: seleziona la risposta corretta.`,
  "err.vAtLeastOneAccepted": (v) =>
    `D${v.n}: aggiungi almeno una risposta accettata.`,
} satisfies Record<Key, Msg>;
