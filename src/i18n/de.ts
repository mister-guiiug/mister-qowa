/** Dictionnaire ALLEMAND — parité des clés imposée par le typage. */
import type { Msg } from "./types";
import type { Key } from "./fr";

const e = (n: number) => (Number(n) === 1 ? "" : "e"); // Spiel → Spiele
const en = (n: number) => (Number(n) === 1 ? "" : "n"); // Frage → Fragen

export const de = {
  // gemeinsam
  "common.home": "Start",
  "common.back": "Zurück",
  "common.cancel": "Abbrechen",
  "common.confirm": "Bestätigen",
  "common.reload": "Neu laden",
  "common.toHome": "Zurück zum Start",
  "common.notFound": "Spiel nicht gefunden",
  "common.sessionGone":
    "Dieses Spiel existiert nicht mehr oder wurde geschlossen.",
  "common.connecting": "Verbinde…",
  "common.pts": (v) => `${v.n} Pkt`,
  "common.questionN": (v) => `Frage ${v.n}/${v.total}`,
  "common.ordinal": (v) => `${v.n}.`,

  // Start
  "home.subtitle":
    "Interaktive Echtzeit-Quizze. Antworte schnell, klettere in der Rangliste.",
  "home.resume": "Spiel fortsetzen",
  "home.quit": "Dieses Spiel verlassen",
  "home.host": "Quiz hosten",
  "home.join": "Einem Spiel beitreten",
  "home.solo": "Solo spielen",
  "home.myGames": "Meine Spiele",

  // Spielerprofil (lokal)
  "profile.summary": (v) =>
    `${v.games} Spiel${e(Number(v.games))} · ${v.points} Pkt`,
  "profile.badge.firstGame": "Erstes Spiel",
  "profile.badge.podium": "Podium",
  "profile.badge.win": "Sieg",
  "profile.badge.veteran": "Veteran",

  // Textimport + Punktestand teilen
  "create.textImportAria": "Aus Text importieren",
  "textImport.title": "Aus Text importieren",
  "textImport.help":
    "Eine Frage pro Zeile, Felder getrennt durch „;“:\n• Multiple Choice: Frage ; *Richtig ; Falsch ; Falsch\n• Wahr/Falsch: Frage ; W (oder F)\n• Freitext: Frage ; =akzeptierte Antwort\n• Umfrage: Frage ; Option A ; Option B",
  "textImport.titlePlaceholder": "Quiz-Titel",
  "textImport.placeholder":
    "Hauptstadt von Frankreich ; *Paris ; Lyon ; Marseille\nDie Erde ist flach ; F\nGrößter Ozean ; =Pazifik",
  "textImport.action": "Importieren",
  "textImport.defaultTitle": "Importiertes Quiz",
  "play.shareScore": "Punktestand teilen",
  "play.shareScoreText": (v) =>
    `Ich wurde ${v.rank} mit ${v.pts} Punkten bei Mister Qowa!`,
  "solo.bestStreak": (v) => `Beste Serie: ${v.n} 🔥`,
  "solo.shareText": (v) => `${v.score} Punkte im Solo bei Mister Qowa!`,

  // Fußzeile
  "footer.source": "Quellcode",
  "footer.support": "Unterstützen",
  "footer.reload": "Neu laden",
  "footer.soundOn": "Ton an",
  "footer.soundOff": "Ton aus",
  "footer.muteAria": "Ton stummschalten",
  "footer.unmuteAria": "Ton aktivieren",
  "footer.langAria": "Sprache",

  // Bibliothek / Erstellung
  "create.title": "Quizze",
  "create.importAria": "Quiz importieren",
  "create.aiAria": "Quiz mit KI generieren",
  "create.new": "Neu",
  "create.searchPlaceholder": "Quiz suchen…",
  "create.sortRecent": "Neueste",
  "create.sortAz": "A→Z",
  "create.teamMode": "Team-Modus",
  "create.teamsCountAria": "Anzahl der Teams",
  "create.teamsOption": (v) => `${v.n} Teams`,
  "create.eliminationMode": "Ausscheidungsmodus",
  "create.myQuizzes": "Meine Quizze",
  "create.questionsCount": (v) => `${v.n} Frage${en(Number(v.n))}`,
  "create.launch": "Starten",
  "create.editAria": "Bearbeiten",
  "create.duplicateAria": "Duplizieren",
  "create.exportAria": "Exportieren",
  "create.deleteAria": "Löschen",
  "create.demoQuizzes": "Demo-Quizze",
  "create.copyToMineAria": "Zum Bearbeiten in meine Quizze kopieren",
  "create.creating": "Spiel wird erstellt…",
  "create.deleteTitle": (v) => `„${v.title}“ löschen?`,
  "create.deleteMsg": "Diese Aktion ist endgültig.",
  "create.duplicateExists": (v) =>
    `„${v.title}“ ist bereits in deiner Bibliothek.`,

  // Quiz-Editor
  "editor.cancel": "Abbrechen",
  "editor.titleNew": "Neues Quiz",
  "editor.titleEdit": "Quiz bearbeiten",
  "editor.titlePlaceholder": "Quiz-Titel",
  "editor.descPlaceholder": "Beschreibung (optional)",
  "editor.addQuestion": "Frage hinzufügen",
  "editor.save": "Quiz speichern",

  // Fragen-Editor
  "qe.typeMultipleChoice": "Multiple Choice",
  "qe.typeTrueFalse": "Wahr / Falsch",
  "qe.typeFreeText": "Freitext",
  "qe.typePoll": "Umfrage (ohne richtige Antwort)",
  "qe.questionN": (v) => `Frage ${v.n}`,
  "qe.moveUp": "Nach oben",
  "qe.moveDown": "Nach unten",
  "qe.removeQuestion": "Frage entfernen",
  "qe.typeAria": "Fragetyp",
  "qe.promptAria": (v) => `Text der Frage ${v.n}`,
  "qe.promptPlaceholder": "Text der Frage",
  "qe.removeImage": "Bild entfernen",
  "qe.addImage": "Bild hinzufügen",
  "qe.uploading": "Wird hochgeladen…",
  "qe.mediaAltPlaceholder": "Bildbeschreibung (Screenreader)",
  "qe.mediaAltAria": (v) => `Bildbeschreibung der Frage ${v.n}`,
  "qe.mediaAltHint":
    "Beschreibe das Bild, ohne die Antwort zu verraten (für blinde Spieler).",
  "qe.correctAnswerAria": "Richtige Antwort",
  "qe.answerN": (v) => `Antwort ${v.n}`,
  "qe.removeOption": "Option entfernen",
  "qe.addOption": "Option hinzufügen",
  "qe.correctHint": "Markiere den grünen Kreis neben der richtigen Antwort.",
  "qe.true": "Wahr",
  "qe.false": "Falsch",
  "qe.acceptedAnswerN": (v) => `Akzeptierte Antwort ${v.n}`,
  "qe.remove": "Entfernen",
  "qe.addAcceptedAnswer": "Weitere akzeptierte Antwort",
  "qe.caseSensitive": "Groß-/Kleinschreibung beachten",
  "qe.explanationPlaceholder": "Erklärung der Antwort (optional)",
  "qe.explanationAria": (v) => `Erklärung der Frage ${v.n}`,
  "qe.time": "Zeit",
  "qe.points": "Punkte",
  "qe.seconds": (v) => `${v.n}s`,

  // KI-Generierung
  "ai.editParams": "Einstellungen bearbeiten",
  "ai.title": "Mit KI generieren",
  "ai.subtitle":
    "Beschreibe ein Thema (oder füge einen Text ein). Die KI schlägt ein Quiz vor, das du vor dem Speichern prüfen und bearbeiten kannst.",
  "ai.topic": "Thema",
  "ai.topicAria": "Quiz-Thema",
  "ai.topicPlaceholder": "z. B. griechische Mythologie, Hauptstädte Europas…",
  "ai.fromText": "…oder aus einem Text (optional)",
  "ai.sourceTextAria": "Quelltext",
  "ai.sourceTextPlaceholder":
    "Füge hier eine Lektion, einen Artikel, eine Zusammenfassung ein…",
  "ai.questions": "Fragen",
  "ai.questionsAria": "Anzahl der Fragen",
  "ai.difficulty": "Schwierigkeit",
  "ai.diffFacile": "leicht",
  "ai.diffMoyen": "mittel",
  "ai.diffDifficile": "schwer",
  "ai.language": "Sprache",
  "ai.generate": "Quiz generieren",
  "ai.tryDemo": "Demomodus ausprobieren (ohne Schlüssel)",
  "ai.generating": "Wird generiert…",
  "ai.previewSub": (v) =>
    `${v.n} Frage${en(Number(v.n))} — prüfen und dann im Editor öffnen.`,
  "ai.regenAria": (v) => `Frage ${v.n} neu generieren`,
  "ai.openEditor": "Im Editor öffnen",
  "ai.apiKey": "Dein API-Schlüssel",
  "ai.keyPlaceholder": (v) => `${v.provider}-Schlüssel`,
  "ai.apiKeyAria": "API-Schlüssel",
  "ai.modelPlaceholder": (v) => `Modell (Standard: ${v.model})`,
  "ai.modelAria": "Modell (optional)",
  "ai.modelUsed": (v) =>
    `Verwendetes Modell: ${v.model}. Der Schlüssel bleibt in deinem Browser (wird nie an unsere Server gesendet) und geht direkt an ${v.provider}.`,
  "ai.getKey": (v) => `Schlüssel holen — ${v.label}`,
  "ai.errNoTopic": "Gib ein Thema an oder füge einen Quelltext ein.",
  "ai.errNoKey": "Gib unten deinen API-Schlüssel ein.",

  // Beitreten
  "join.title": "Einem Spiel beitreten",
  "join.pickTeam": (v) => `Wähle dein Team, ${v.pseudo}:`,
  "join.pinLabel": "PIN-Code",
  "join.pinAria": (v) => `PIN-Code, ${v.n} von ${v.total} Ziffern`,
  "join.pseudoLabel": "Dein Spitzname",
  "join.pseudoPlaceholder": "Alex",
  "join.avatarLabel": "Dein Avatar",
  "join.avatarAria": (v) => `Avatar ${v.a}`,
  "join.submit": "Spiel betreten",

  // Spieler (Play)
  "play.kicked": "Du wurdest entfernt",
  "play.kickedMsg": "Der Host hat dich aus diesem Spiel entfernt.",
  "play.welcome": (v) => `Willkommen ${v.pseudo}!`,
  "play.waiting": "Warte auf den Start durch den Host…",
  "play.pauseBadge": "⏸ Pause",
  "play.eliminated": "💀 Ausgeschieden",
  "play.eliminatedMsg":
    "Du bleibst als Zuschauer — viel Glück den Überlebenden!",
  "play.answerPlaceholder": "Deine Antwort…",
  "play.send": "Senden",
  "play.sent": "Antwort gesendet ✓ — warte auf das Ergebnis…",
  "play.voteThanks": "Danke für deine Stimme 🗳️",
  "play.correct": "Richtig!",
  "play.wrong": "Falsch!",
  "play.noAnswer": "Keine Antwort",
  "play.zeroPt": "+0 Pkt",
  "play.awarded": (v) => `+${v.n} Pkt`,
  "play.results": "Ergebnisse…",
  "play.expectedAnswer": (v) => `Erwartete Antwort: „${v.answer}“`,
  "play.rankLine": (v) => `Du bist ${v.rank} · ${v.pts} Pkt`,
  "play.podiumRank": (v) => `Du wirst ${v.rank}! 🎉`,
  "play.quit": "Verlassen",

  // Host
  "host.connecting": "Verbinde mit dem Spiel…",
  "host.quizLostTitle": "Quiz auf diesem Gerät nicht verfügbar",
  "host.quizLostBody":
    "Das gehostete Quiz ist nicht in der Bibliothek dieses Geräts (Speicher geleert oder anderer Browser). Schließe den Raum, um die PIN freizugeben.",
  "host.closeRoom": "Raum schließen",
  "host.linkCopied": "Link kopiert!",
  "host.shareUnavailable": "Teilen nicht verfügbar",
  "host.inviteText": "Tritt meinem Quiz-Spiel bei!",
  "host.resultTitle": "Mister-Qowa-Ergebnisse",
  "host.playersConnected": (v) => `${v.n} Spieler verbunden`,
  "host.kickAria": (v) => `${v.pseudo} entfernen`,
  "host.invite": "Einladen",
  "host.start": "Spiel starten",
  "host.pause": "Pause",
  "host.resume": "Fortsetzen",
  "host.replay": "Neu stellen",
  "host.skip": "Überspringen",
  "host.closeNow": "Jetzt schließen",
  "host.answered": (v) => `${v.count}/${v.total} haben geantwortet`,
  "host.inPlaySuffix": (v) => ` · 💀 ${v.n} im Spiel`,
  "host.leaderboardTitle": "Rangliste",
  "host.survivorsLine": (v) => `💀 ${v.n} Spieler noch im Spiel`,
  "host.nextQuestion": "Nächste Frage",
  "host.endPodium": "Beenden & Podium",
  "host.podiumTitle": "Podium 🎉",
  "host.replayWithSame": "Mit denselben erneut spielen",
  "host.shareResult": "Ergebnis teilen",
  "host.newGame": "Neues Spiel",

  // Solo
  "solo.changeQuiz": "Quiz wechseln",
  "solo.title": "Solo spielen",
  "solo.play": "Spielen",
  "solo.finished": "Fertig! 🎉",
  "solo.replay": "Erneut spielen",
  "solo.otherQuiz": "Anderes Quiz",
  "solo.answerPlaceholder": "Deine Antwort…",
  "solo.answerAria": "Deine Antwort",
  "solo.validate": "Bestätigen",
  "solo.voteRecorded": "Stimme erfasst 🗳️",
  "solo.timeUp": "Zeit abgelaufen!",
  "solo.correct": "Richtig!",
  "solo.wrong": "Falsch!",
  "solo.next": "Weiter",
  "solo.seeScore": "Punktzahl ansehen",
  "solo.secondsShort": (v) => `${v.n}s`,

  // Verlauf
  "history.title": "Meine Spiele",
  "history.loading": "Verlauf wird geladen…",
  "history.empty":
    "Noch keine beendeten Spiele. Starte ein Quiz und beende es, um es hier zu sehen!",
  "history.byQuiz": "Nach Quiz",
  "history.aggLine": (v) =>
    `${v.games} Spiel${e(Number(v.games))} · Ø ${v.avg} · Rekord ${v.best}`,
  "history.gameSub": (v) => `${v.date} · ${v.players} Spieler`,
  "history.winnerLine": (v) => `${v.pseudo} · ${v.pts} Pkt`,
  "history.hardest": (v) => `Schwerste: „${v.prompt}“ — ${v.pct}% richtig`,

  // Reaktionen / Sonstiges
  "reactions.sendAria": (v) => `Reaktion ${v.emoji} senden`,
  "countdown.aria": (v) => `${v.n} Sekunden übrig`,
  "connection.offline": "Offline — verbinde neu…",
  "pin.label": "PIN-Code",
  "update.available": "Neue Version verfügbar",
  "update.updating": "Wird aktualisiert…",
  "update.later": "Später",
  "install.prompt": "Mister Qowa auf deinem Gerät installieren?",
  "install.action": "Installieren",
  "leaderboard.empty": "Noch niemand…",

  // Fehler
  "err.generic": "Ein Fehler ist aufgetreten.",
  "err.crashTitle": "Hoppla…",
  "err.crashBody":
    "Ein Fehler ist aufgetreten. Lade die App neu, um fortzufahren.",
  "err.configTitle": "Dienst nicht verfügbar",
  "err.appCheckMissing":
    "Der Bot-Schutz (App Check) ist für diese Bereitstellung nicht konfiguriert. Wende dich an den Organisator.",
  "err.pinAllocFailed": "PIN konnte nicht vergeben werden.",
  "err.noMoreQuestions": "Keine weiteren Fragen.",
  "err.pinInvalid": "Ungültiger PIN.",
  "err.gameStarted": "Das Spiel hat bereits begonnen.",
  "err.youAreBanned": "Du wurdest aus diesem Spiel entfernt.",
  "err.gameFull": "Spiel voll.",
  "err.pickImage": "Wähle ein Bild.",
  "err.imageTooHeavy": "Bild auch komprimiert zu groß (max. 3 MB).",
  "err.fileUnreadable": "Datei unlesbar (ungültiges JSON).",
  "err.notAQuiz": "Diese Datei ist kein gültiges Quiz.",
  "err.aiNoKey": "Gib zuerst deinen API-Schlüssel ein.",
  "err.aiUnreadable": "KI-Antwort unlesbar (kein JSON gefunden).",
  "err.aiNoContent": (v) => `${v.provider} hat keinen Inhalt zurückgegeben.`,
  "err.aiKeyRejected": (v) =>
    `${v.provider}-Schlüssel abgelehnt (prüfe, ob er gültig und aktiv ist).`,
  "err.aiQuota": (v) =>
    `${v.provider}-Kontingent überschritten — versuche es später.`,
  "err.aiStatus": (v) =>
    `${v.provider} antwortete ${v.status}${v.detail ? `: ${v.detail}` : ""}.`,
  "err.aiTimeout": "Generierung abgelaufen — versuche es erneut.",
  "err.aiNetwork": "Anbieter nicht erreichbar (Netzwerk oder CORS).",
  "err.aiBadFormat":
    "Die KI hat ein fehlerhaftes Quiz erzeugt — versuche es erneut.",
  "err.aiRegenFailed": "Neugenerierung fehlgeschlagen — versuche es erneut.",
  "err.aiInvalidQuiz": "Generiertes Quiz ist ungültig — versuche es erneut.",
  "err.vTitle": "Gib dem Quiz einen Titel.",
  "err.vAtLeastOneQuestion": "Füge mindestens eine Frage hinzu.",
  "err.vEmptyPrompt": (v) => `F${v.n}: Der Text ist leer.`,
  "err.vFillTwoOptions": (v) =>
    `F${v.n}: Fülle mindestens 2 Antworten aus (einige sind leer).`,
  "err.vAtLeastTwoOptions": (v) =>
    `F${v.n}: Es sind mindestens 2 Antworten nötig.`,
  "err.vDuplicateOptions": (v) => `F${v.n}: Zwei Antworten sind identisch.`,
  "err.vDuplicateOptionIds": (v) => `F${v.n}: Doppelte Antwort-IDs.`,
  "err.vSelectCorrect": (v) => `F${v.n}: Wähle die richtige Antwort.`,
  "err.vAtLeastOneAccepted": (v) =>
    `F${v.n}: Füge mindestens eine akzeptierte Antwort hinzu.`,
} satisfies Record<Key, Msg>;
