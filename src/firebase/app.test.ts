import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * CE QUE CE TEST TIENT : la base s'ouvre en WebSocket seul.
 *
 * Sans `forceWebSockets()` AVANT `getDatabase()`, une marque
 * `firebase:previous_websocket_failure` restée dans le stockage local (page
 * fermée avant que la connexion soit jugée saine) faisait démarrer le SDK en
 * long polling, des scripts JSONP que la CSP refuse : la base ne se connectait
 * plus jamais dans ce navigateur (voir `ensure`). L'ordre compte : appelé après
 * l'ouverture des transports, le réglage n'est plus lu.
 */
const mocks = vi.hoisted(() => ({ appels: [] as string[] }));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'test' })),
}));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInAnonymously: vi.fn(),
  signOut: vi.fn(),
  deleteUser: vi.fn(),
  onAuthStateChanged: vi.fn(),
  connectAuthEmulator: vi.fn(),
}));
vi.mock('firebase/database', () => ({
  forceWebSockets: vi.fn(() => mocks.appels.push('forceWebSockets')),
  getDatabase: vi.fn(() => {
    mocks.appels.push('getDatabase');
    return { type: 'database' };
  }),
  connectDatabaseEmulator: vi.fn(),
}));
vi.mock('firebase/app-check', () => ({
  initializeAppCheck: vi.fn(),
  ReCaptchaEnterpriseProvider: vi.fn(),
}));
vi.mock('./env', () => ({ useEmulator: false }));

/** Un module neuf à chaque test : `ensure` mémorise l'app ouverte. */
const freshApp = async () => {
  vi.resetModules();
  return import('./app');
};

beforeEach(() => {
  mocks.appels.length = 0;
});

describe('getDb — WebSocket seul', () => {
  it('force le WebSocket AVANT d’ouvrir la base', async () => {
    const { getDb } = await freshApp();
    getDb();
    expect(mocks.appels).toEqual(['forceWebSockets', 'getDatabase']);
  });

  it('n’ouvre la base qu’une fois', async () => {
    const { getDb } = await freshApp();
    expect(getDb()).toBe(getDb());
    expect(mocks.appels).toEqual(['forceWebSockets', 'getDatabase']);
  });
});
