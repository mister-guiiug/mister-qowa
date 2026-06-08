/**
 * Smoke test end-to-end contre les émulateurs Firebase : joue une partie complète
 * (host + 1 joueur) et vérifie le scoring autoritaire. Lancé via emulators:exec.
 */
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  signInAnonymously,
} from 'firebase/auth';
import {
  getDatabase,
  connectDatabaseEmulator,
  ref,
  get,
  set,
  serverTimestamp,
} from 'firebase/database';
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
} from 'firebase/functions';

const cfg = {
  projectId: 'demo-qowa',
  apiKey: 'fake',
  databaseURL: 'https://demo-qowa-default-rtdb.firebaseio.com',
};

function client(name) {
  const app = initializeApp(cfg, name);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getDatabase(app);
  connectDatabaseEmulator(db, '127.0.0.1', 9000);
  const fns = getFunctions(app, 'europe-west1');
  connectFunctionsEmulator(fns, '127.0.0.1', 5001);
  return { auth, db, fns };
}

function shardOf(uid, shards = 20) {
  let h = 0;
  for (let i = 0; i < uid.length; i += 1) h = (h * 31 + uid.charCodeAt(i)) | 0;
  return Math.abs(h) % shards;
}

const fail = (m) => {
  console.error('❌ FAIL:', m);
  process.exit(1);
};

const host = client('host');
const player = client('player');

await signInAnonymously(host.auth);
const pu = await signInAnonymously(player.auth);
const pid = pu.user.uid;

// 1. host crée la session
const { data: cs } = await httpsCallable(host.fns, 'createSession')({
  quizId: 'demo-culture-g',
});
const { sessionId, pin } = cs;
console.log(`1. createSession → sessionId=${sessionId.slice(0, 8)}… pin=${pin}`);
if (!sessionId || pin.length !== 8) fail('createSession invalide');

// 2. joueur rejoint
await httpsCallable(player.fns, 'joinSession')({ pin, pseudo: 'Alex' });
console.log('2. joinSession → OK');

// 3. host lance la 1re question
await httpsCallable(host.fns, 'nextQuestion')({ sessionId });
const cur = (await get(ref(host.db, `sessions/${sessionId}/current`))).val();
console.log(`3. nextQuestion → q=${cur.questionId} (${cur.options.map((o) => o.id).join(',')}), endsAt dans ${cur.endsAt - Date.now()}ms`);
if (cur.correctOptionId !== undefined) fail('la question publique NE doit PAS exposer la bonne réponse');

// 4. joueur répond 'b' (bonne réponse de q1) — écriture RTDB directe shardée
const shard = shardOf(pid);
await set(ref(player.db, `sessions/${sessionId}/answers/${cur.questionId}/${shard}/${pid}`), {
  choice: 'b',
  serverTs: serverTimestamp(),
});
console.log(`4. submitAnswer (écriture directe, shard ${shard}) → OK (rules ont accepté)`);

// 5. host clôt la question → scoring autoritaire au REVEAL
await httpsCallable(host.fns, 'closeQuestion')({ sessionId });
const score = (await get(ref(host.db, `sessions/${sessionId}/scores/${pid}`))).val();
const reveal = (await get(ref(host.db, `sessions/${sessionId}/reveal/${cur.questionId}/${pid}`))).val();
const lb = (await get(ref(host.db, `sessions/${sessionId}/leaderboard/top`))).val();
console.log(`5. closeQuestion → score=${JSON.stringify(score)} reveal=${JSON.stringify(reveal)}`);
console.log(`   leaderboard=${JSON.stringify(lb)}`);
if (!reveal?.correct) fail('reveal devrait être correct=true');
if (!score || score.total <= 0) fail('score non attribué');
if (score.streak !== 1) fail('streak devrait être 1');
if (!Array.isArray(lb) || lb[0]?.uid !== pid) fail('leaderboard incohérent');

// 6. host termine → podium (snapshot Firestore non testable ici : émulateur Firestore KO sous JDK21)
try {
  await httpsCallable(host.fns, 'endGame')({ sessionId });
  const finalState = (await get(ref(host.db, `sessions/${sessionId}/state`))).val();
  console.log(`6. endGame → state=${finalState} (snapshot Firestore ignoré sans émulateur)`);
} catch (e) {
  console.log(`6. endGame → ignoré (dépend de Firestore, non émulé ici) : ${String(e).slice(0, 80)}`);
}

console.log('\n✅ SMOKE TEST PASSED — boucle de scoring autoritaire OK (auth + functions + rules + écriture directe + REVEAL + leaderboard)');
process.exit(0);
