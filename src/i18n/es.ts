/** Dictionnaire ESPAGNOL — parité des clés imposée par le typage. */
import type { Msg } from "./types";
import type { Key } from "./fr";

const s = (n: number) => (Number(n) === 1 ? "" : "s"); // pregunta/equipo/partida
const cons = (n: number) => (Number(n) === 1 ? "" : "es"); // jugador -> jugadores

const esOrdinal = (n: number) => `${n}.º`;

export const es = {
  // común
  "common.home": "Inicio",
  "common.back": "Atrás",
  "common.cancel": "Cancelar",
  "common.confirm": "Confirmar",
  "common.reload": "Recargar",
  "common.toHome": "Volver al inicio",
  "common.notFound": "Partida no encontrada",
  "common.sessionGone": "Esta partida ya no existe o se ha cerrado.",
  "common.connecting": "Conectando…",
  "common.pts": (v) => `${v.n} pts`,
  "common.questionN": (v) => `Pregunta ${v.n}/${v.total}`,
  "common.ordinal": (v) => esOrdinal(Number(v.n)),

  // inicio
  "home.subtitle":
    "Cuestionarios interactivos en tiempo real. Responde rápido, sube en la clasificación.",
  "home.resume": "Reanudar la partida",
  "home.quit": "Salir de esta partida",
  "home.host": "Crear un cuestionario",
  "home.join": "Unirse a una partida",
  "home.solo": "Jugar en solitario",
  "home.myGames": "Mis partidas",
  "home.myAccount": "Mi cuenta",

  // perfil del jugador (local)
  "profile.summary": (v) =>
    `${v.games} partida${s(Number(v.games))} · ${v.points} pts`,
  "profile.badge.firstGame": "Primera partida",
  "profile.badge.podium": "Podio",
  "profile.badge.win": "Victoria",
  "profile.badge.veteran": "Veterano",

  // importar desde texto + compartir puntuación
  "create.textImportAria": "Importar desde texto",
  "textImport.title": "Importar desde texto",
  "textImport.help":
    "Una pregunta por línea, campos separados por «;»:\n• Opción múltiple: Enunciado ; *Correcta ; Incorrecta ; Incorrecta\n• Verdadero/Falso: Enunciado ; V (o F)\n• Texto libre: Enunciado ; =respuesta aceptada\n• Encuesta: Enunciado ; Opción A ; Opción B",
  "textImport.titlePlaceholder": "Título del cuestionario",
  "textImport.placeholder":
    "Capital de Francia ; *París ; Lyon ; Marsella\nLa Tierra es plana ; F\nOcéano más grande ; =Pacífico",
  "textImport.action": "Importar",
  "textImport.defaultTitle": "Cuestionario importado",
  "play.shareScore": "Compartir mi puntuación",
  "play.shareScoreText": (v) =>
    `¡Acabé ${v.rank} con ${v.pts} puntos en Mister Qowa!`,
  "solo.bestStreak": (v) => `Mejor racha: ${v.n} 🔥`,
  "solo.shareText": (v) => `¡${v.score} puntos en solitario en Mister Qowa!`,

  // pie
  "footer.source": "Código fuente",
  "footer.support": "Apoyar",
  "footer.issues": "Informar de un problema",
  "footer.reload": "Recargar",
  "footer.soundOn": "Sonido activado",
  "footer.soundOff": "Sonido apagado",
  "footer.muteAria": "Silenciar el sonido",
  "footer.unmuteAria": "Activar el sonido",
  "footer.langAria": "Idioma",

  // biblioteca / creación
  "create.title": "Cuestionarios",
  "create.importAria": "Importar un cuestionario",
  "create.aiAria": "Generar un cuestionario con IA",
  "create.new": "Nuevo",
  "create.searchPlaceholder": "Buscar un cuestionario…",
  "create.sortRecent": "Recientes",
  "create.sortAz": "A→Z",
  "create.teamMode": "Modo equipos",
  "create.teamsCountAria": "Número de equipos",
  "create.teamsOption": (v) => `${v.n} equipos`,
  "create.eliminationMode": "Modo eliminación",
  "create.myQuizzes": "Mis cuestionarios",
  "create.questionsCount": (v) => `${v.n} pregunta${s(Number(v.n))}`,
  "create.launch": "Iniciar",
  "create.editAria": "Editar",
  "create.duplicateAria": "Duplicar",
  "create.exportAria": "Exportar",
  "create.deleteAria": "Eliminar",
  "create.demoQuizzes": "Cuestionarios de demostración",
  "create.copyToMineAria": "Copiar a mis cuestionarios para editar",
  "create.creating": "Creando la partida…",
  "create.deleteTitle": (v) => `¿Eliminar «${v.title}»?`,
  "create.deleteMsg": "Esta acción es permanente.",
  "create.duplicateExists": (v) => `«${v.title}» ya está en tu biblioteca.`,

  // editor de cuestionario
  "editor.cancel": "Cancelar",
  "editor.titleNew": "Nuevo cuestionario",
  "editor.titleEdit": "Editar cuestionario",
  "editor.titlePlaceholder": "Título del cuestionario",
  "editor.descPlaceholder": "Descripción (opcional)",
  "editor.addQuestion": "Añadir una pregunta",
  "editor.save": "Guardar cuestionario",

  // editor de pregunta
  "qe.typeMultipleChoice": "Opción múltiple",
  "qe.typeTrueFalse": "Verdadero / Falso",
  "qe.typeFreeText": "Texto libre",
  "qe.typePoll": "Encuesta (sin respuesta correcta)",
  "qe.questionN": (v) => `Pregunta ${v.n}`,
  "qe.moveUp": "Subir",
  "qe.moveDown": "Bajar",
  "qe.removeQuestion": "Eliminar pregunta",
  "qe.typeAria": "Tipo de pregunta",
  "qe.promptAria": (v) => `Enunciado de la pregunta ${v.n}`,
  "qe.promptPlaceholder": "Enunciado de la pregunta",
  "qe.removeImage": "Quitar la imagen",
  "qe.addImage": "Añadir una imagen",
  "qe.uploading": "Subiendo…",
  "qe.mediaAltPlaceholder": "Descripción de la imagen (lectores de pantalla)",
  "qe.mediaAltAria": (v) => `Descripción de la imagen de la pregunta ${v.n}`,
  "qe.mediaAltHint":
    "Describe la imagen sin revelar la respuesta (la leen los jugadores ciegos).",
  "qe.correctAnswerAria": "Respuesta correcta",
  "qe.answerN": (v) => `Respuesta ${v.n}`,
  "qe.removeOption": "Quitar la opción",
  "qe.addOption": "Añadir una opción",
  "qe.correctHint": "Marca el círculo verde junto a la respuesta correcta.",
  "qe.true": "Verdadero",
  "qe.false": "Falso",
  "qe.acceptedAnswerN": (v) => `Respuesta aceptada ${v.n}`,
  "qe.remove": "Quitar",
  "qe.addAcceptedAnswer": "Otra respuesta aceptada",
  "qe.caseSensitive": "Distingue mayúsculas",
  "qe.explanationPlaceholder": "Explicación de la respuesta (opcional)",
  "qe.explanationAria": (v) => `Explicación de la pregunta ${v.n}`,
  "qe.time": "Tiempo",
  "qe.points": "Puntos",
  "qe.seconds": (v) => `${v.n}s`,

  // generación con IA
  "ai.editParams": "Editar los ajustes",
  "ai.title": "Generar con IA",
  "ai.subtitle":
    "Describe un tema (o pega un texto). La IA propone un cuestionario que podrás revisar y editar antes de guardar.",
  "ai.topic": "Tema",
  "ai.topicAria": "Tema del cuestionario",
  "ai.topicPlaceholder": "Ej.: la mitología griega, las capitales de Europa…",
  "ai.fromText": "…o a partir de un texto (opcional)",
  "ai.sourceTextAria": "Texto fuente",
  "ai.sourceTextPlaceholder": "Pega aquí una lección, un artículo, un resumen…",
  "ai.questions": "Preguntas",
  "ai.questionsAria": "Número de preguntas",
  "ai.difficulty": "Dificultad",
  "ai.diffFacile": "fácil",
  "ai.diffMoyen": "media",
  "ai.diffDifficile": "difícil",
  "ai.language": "Idioma",
  "ai.generate": "Generar cuestionario",
  "ai.tryDemo": "Probar el modo demo (sin clave)",
  "ai.generating": "Generando…",
  "ai.previewSub": (v) =>
    `${v.n} pregunta${s(Number(v.n))} — revisa y luego abre en el editor.`,
  "ai.regenAria": (v) => `Regenerar la pregunta ${v.n}`,
  "ai.openEditor": "Abrir en el editor",
  "ai.apiKey": "Tu clave API",
  "ai.keyPlaceholder": (v) => `Clave ${v.provider}`,
  "ai.apiKeyAria": "Clave API",
  "ai.modelPlaceholder": (v) => `Modelo (por defecto: ${v.model})`,
  "ai.modelAria": "Modelo (opcional)",
  "ai.modelUsed": (v) =>
    `Modelo usado: ${v.model}. La clave permanece en tu navegador (nunca se envía a nuestros servidores) y va directamente a ${v.provider}.`,
  "ai.getKey": (v) => `Conseguir una clave — ${v.label}`,
  "ai.errNoTopic": "Indica un tema o pega un texto fuente.",
  "ai.errNoKey": "Introduce tu clave API más abajo.",

  // unirse
  "join.title": "Unirse a una partida",
  "join.pickTeam": (v) => `Elige tu equipo, ${v.pseudo}:`,
  "join.pinLabel": "Código PIN",
  "join.pinAria": (v) => `Código PIN, ${v.n} de ${v.total} dígitos`,
  "join.pseudoLabel": "Tu apodo",
  "join.pseudoPlaceholder": "Alex",
  "join.avatarLabel": "Tu avatar",
  "join.avatarAria": (v) => `Avatar ${v.a}`,
  "join.submit": "Entrar en la partida",

  // jugador (Play)
  "play.kicked": "Te han expulsado",
  "play.kickedMsg": "El anfitrión te ha expulsado de esta partida.",
  "play.welcome": (v) => `¡Bienvenido ${v.pseudo}!`,
  "play.waiting": "Esperando a que el anfitrión empiece…",
  "play.pauseBadge": "⏸ Pausa",
  "play.eliminated": "💀 Eliminado",
  "play.eliminatedMsg":
    "Sigues como espectador — ¡suerte a los supervivientes!",
  "play.answerPlaceholder": "Tu respuesta…",
  "play.send": "Enviar",
  "play.sent": "Respuesta enviada ✓ — espera el resultado…",
  "play.voteThanks": "Gracias por tu voto 🗳️",
  "play.correct": "¡Correcto!",
  "play.wrong": "¡Fallaste!",
  "play.noAnswer": "Sin respuesta",
  "play.zeroPt": "+0 pt",
  "play.awarded": (v) => `+${v.n} pts`,
  "play.results": "Resultados…",
  "play.expectedAnswer": (v) => `Respuesta esperada: «${v.answer}»`,
  "play.rankLine": (v) => `Vas ${v.rank} · ${v.pts} pts`,
  "play.podiumRank": (v) => `¡Acabas ${v.rank}! 🎉`,
  "play.quit": "Salir",

  // anfitrión (Host)
  "host.connecting": "Conectando a la partida…",
  "host.quizLostTitle": "Cuestionario no disponible en este dispositivo",
  "host.quizLostBody":
    "El cuestionario alojado no está en la biblioteca de este dispositivo (memoria borrada u otro navegador). Cierra la sala para liberar el PIN.",
  "host.closeRoom": "Cerrar la sala",
  "host.linkCopied": "¡Enlace copiado!",
  "host.shareUnavailable": "Compartir no disponible",
  "host.inviteText": "¡Únete a mi partida de cuestionario!",
  "host.resultTitle": "Resultados de Mister Qowa",
  "host.playersConnected": (v) =>
    `${v.n} jugador${cons(Number(v.n))} conectado${s(Number(v.n))}`,
  "host.kickAria": (v) => `Expulsar a ${v.pseudo}`,
  "host.invite": "Invitar",
  "host.start": "Empezar la partida",
  "host.pause": "Pausa",
  "host.resume": "Reanudar",
  "host.replay": "Repetir",
  "host.skip": "Saltar",
  "host.closeNow": "Cerrar ahora",
  "host.answered": (v) => `${v.count}/${v.total} han respondido`,
  "host.inPlaySuffix": (v) => ` · 💀 ${v.n} en juego`,
  "host.leaderboardTitle": "Clasificación",
  "host.survivorsLine": (v) =>
    `💀 ${v.n} jugador${cons(Number(v.n))} sigue${s(Number(v.n))} en juego`,
  "host.nextQuestion": "Siguiente pregunta",
  "host.endPodium": "Terminar y podio",
  "host.podiumTitle": "Podio 🎉",
  "host.replayWithSame": "Volver a jugar con los mismos",
  "host.shareResult": "Compartir el resultado",
  "host.newGame": "Nueva partida",

  // solo
  "solo.changeQuiz": "Cambiar de cuestionario",
  "solo.title": "Jugar en solitario",
  "solo.play": "Jugar",
  "solo.finished": "¡Terminado! 🎉",
  "solo.replay": "Volver a jugar",
  "solo.otherQuiz": "Otro cuestionario",
  "solo.answerPlaceholder": "Tu respuesta…",
  "solo.answerAria": "Tu respuesta",
  "solo.validate": "Validar",
  "solo.voteRecorded": "Voto registrado 🗳️",
  "solo.timeUp": "¡Se acabó el tiempo!",
  "solo.correct": "¡Correcto!",
  "solo.wrong": "¡Fallaste!",
  "solo.next": "Siguiente",
  "solo.seeScore": "Ver la puntuación",
  "solo.secondsShort": (v) => `${v.n}s`,

  // historial
  "history.title": "Mis partidas",
  "history.loading": "Cargando el historial…",
  "history.empty":
    "Aún no hay partidas terminadas. ¡Inicia un cuestionario y termínalo para verlo aquí!",
  "history.byQuiz": "Por cuestionario",
  "history.aggLine": (v) =>
    `${v.games} partida${s(Number(v.games))} · med. ${v.avg} · récord ${v.best}`,
  "history.gameSub": (v) =>
    `${v.date} · ${v.players} jugador${cons(Number(v.players))}`,
  "history.winnerLine": (v) => `${v.pseudo} · ${v.pts} pts`,
  "history.hardest": (v) => `Más fallada: «${v.prompt}» — ${v.pct}% de acierto`,

  // mi cuenta (cerrar sesión + eliminación)
  "account.title": "Mi cuenta",
  "account.guestTitle": "Cuenta de invitado",
  "account.guestBody":
    "Mister Qowa no pide correo ni contraseña: se crea para ti una cuenta de invitado anónima en la primera partida. Es la que vincula contigo las partidas que organizas.",
  "account.uidLabel": "Identificador",
  "account.uidPending": "Todavía no hay cuenta.",
  "account.signOutTitle": "Cerrar sesión",
  "account.signOutBody":
    "Una cuenta de invitado no se recupera: sin correo ni contraseña, nada permite volver a ella. En la próxima partida se creará una cuenta de invitado nueva, y el historial de esta quedará ilegible para siempre — sin llegar a borrarse. Para borrarlo, usa la eliminación de abajo.",
  "account.signOut": "Cerrar sesión",
  "account.signOutConfirm": "¿Cerrar la sesión de esta cuenta de invitado?",
  "account.signOutDone":
    "Sesión cerrada. Se creará una cuenta de invitado nueva en tu próxima partida.",
  "account.dangerTitle": "Zona peligrosa",
  "account.deleteTitle": "Eliminar mi cuenta",
  "account.deleteBody": "Se borra, sin vuelta atrás:",
  "account.deleteItemResults":
    "las partidas que has organizado, con los apodos y las puntuaciones de los jugadores que contienen;",
  "account.deleteItemQuizzes": "los cuestionarios de los que eres propietario;",
  "account.deleteItemLocal":
    "lo que guarda este dispositivo — biblioteca de cuestionarios, perfil, clave de API de IA (el idioma elegido sí se conserva);",
  "account.deleteItemAccount": "la propia cuenta de invitado.",
  "account.deleteLimit":
    "Lo que no se va: si has jugado en la partida de otra persona, tu apodo y tu puntuación figuran en SU partida archivada. Le pertenece y solo ella puede borrarla — borrarla en su lugar se llevaría también la clasificación de los demás jugadores.",
  "account.typeToConfirm": "Para confirmar, escribe «{word}» abajo.",
  "account.confirmWord": "ELIMINAR",
  "account.delete": "Eliminar definitivamente",
  "account.deleting": "Eliminando…",
  "account.deleteDone":
    "Cuenta eliminada. Todo lo que te pertenecía se ha borrado.",
  "account.deleteDoneNoAccount":
    "Tus datos se han borrado. Firebase se niega a retirar el identificador sin un inicio de sesión reciente, y una cuenta de invitado no tiene forma de volver a iniciar sesión: queda un identificador vacío, sin ningún dato asociado. Cierra la sesión para empezar con una cuenta nueva.",

  // reacciones / varios
  "reactions.sendAria": (v) => `Enviar la reacción ${v.emoji}`,
  "countdown.aria": (v) => `${v.n} segundos restantes`,
  "connection.offline": "Sin conexión — reconectando…",
  "guard.offline": "No disponible sin conexión — esto necesita red.",
  "pin.label": "Código PIN",
  "update.available": "Nueva versión disponible",
  "update.updating": "Actualizando…",
  "update.later": "Más tarde",
  "leaderboard.empty": "Nadie por ahora…",
  "install.prompt": "¿Instalar Mister Qowa en tu dispositivo?",
  "install.action": "Instalar",

  // errores
  "err.generic": "Se ha producido un error.",
  "err.crashTitle": "Vaya…",
  "err.crashBody":
    "Se ha producido un error. Recarga la aplicación para continuar.",
  "err.configTitle": "Servicio no disponible",
  "err.appCheckMissing":
    "La protección antibots (App Check) no está configurada para este despliegue. Contacta con el organizador.",
  "err.accountDeleteFailed":
    "La eliminación no se ha podido completar. Inténtalo de nuevo; si persiste, infórmalo desde el pie de página.",
  "err.signOutFailed": "No se ha podido cerrar la sesión — inténtalo de nuevo.",
  "err.pinAllocFailed": "No se pudo asignar un PIN.",
  "err.noMoreQuestions": "No hay más preguntas.",
  "err.pinInvalid": "PIN no válido.",
  "err.gameStarted": "La partida ya ha empezado.",
  "err.youAreBanned": "Te han expulsado de esta partida.",
  "err.gameFull": "Partida completa.",
  "err.pickImage": "Elige una imagen.",
  "err.imageTooHeavy":
    "Imagen demasiado pesada incluso comprimida (máx. 3 MB).",
  "err.fileUnreadable": "Archivo ilegible (JSON no válido).",
  "err.notAQuiz": "Este archivo no es un cuestionario válido.",
  "err.aiNoKey": "Introduce primero tu clave API.",
  "err.aiUnreadable": "Respuesta de IA ilegible (no se encontró JSON).",
  "err.aiNoContent": (v) => `${v.provider} no devolvió ningún contenido.`,
  "err.aiKeyRejected": (v) =>
    `Clave de ${v.provider} rechazada (comprueba que sea válida y esté activa).`,
  "err.aiQuota": (v) =>
    `Cuota de ${v.provider} superada — inténtalo más tarde.`,
  "err.aiStatus": (v) =>
    `${v.provider} respondió ${v.status}${v.detail ? `: ${v.detail}` : ""}.`,
  "err.aiTimeout": "La generación expiró — inténtalo de nuevo.",
  "err.aiNetwork": "No se pudo contactar con el proveedor (red o CORS).",
  "err.aiBadFormat": "La IA produjo un cuestionario mal formado — reinténtalo.",
  "err.aiRegenFailed": "La regeneración falló — inténtalo de nuevo.",
  "err.aiInvalidQuiz": "El cuestionario generado no es válido — reinténtalo.",
  "err.vTitle": "Pon un título al cuestionario.",
  "err.vAtLeastOneQuestion": "Añade al menos una pregunta.",
  "err.vEmptyPrompt": (v) => `P${v.n}: el enunciado está vacío.`,
  "err.vFillTwoOptions": (v) =>
    `P${v.n}: rellena al menos 2 respuestas (algunas están vacías).`,
  "err.vAtLeastTwoOptions": (v) =>
    `P${v.n}: se necesitan al menos 2 respuestas.`,
  "err.vDuplicateOptions": (v) => `P${v.n}: dos respuestas son idénticas.`,
  "err.vDuplicateOptionIds": (v) =>
    `P${v.n}: identificadores de respuesta duplicados.`,
  "err.vSelectCorrect": (v) => `P${v.n}: selecciona la respuesta correcta.`,
  "err.vAtLeastOneAccepted": (v) =>
    `P${v.n}: añade al menos una respuesta aceptada.`,
} satisfies Record<Key, Msg>;
