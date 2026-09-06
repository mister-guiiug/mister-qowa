import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isRecentLoginRequired,
  runAccountDeletion,
  purgeLocalData,
  outcomeMessageKey,
  LOCAL_PREFIX,
  KEPT_LOCAL_KEYS,
} from "./account";

/** L'erreur telle que le SDK Firebase la lève : un `code`, pas un message. */
const firebaseError = (code: string) =>
  Object.assign(new Error(`Firebase: Error (${code}).`), { code });

describe("isRecentLoginRequired", () => {
  it("reconnaît le code du SDK", () => {
    expect(isRecentLoginRequired(firebaseError("auth/requires-recent-login"))) //
      .toBe(true);
  });

  it("ne confond pas avec un autre code d'auth", () => {
    expect(isRecentLoginRequired(firebaseError("auth/network-request-failed"))) //
      .toBe(false);
    expect(isRecentLoginRequired(firebaseError("auth/user-token-expired"))) //
      .toBe(false);
  });

  it("tolère une erreur sans code mais dont le message le porte", () => {
    expect(
      isRecentLoginRequired(new Error("… (auth/requires-recent-login).")),
    ).toBe(true);
  });

  it("ne casse pas sur ce qui n'est pas une erreur", () => {
    expect(isRecentLoginRequired(null)).toBe(false);
    expect(isRecentLoginRequired("auth/requires-recent-login")).toBe(false);
    expect(isRecentLoginRequired(undefined)).toBe(false);
  });
});

describe("runAccountDeletion", () => {
  const deps = () => ({
    purgeRemote: vi.fn(async () => 3),
    purgeLocal: vi.fn(() => [
      `${LOCAL_PREFIX}quizzes`,
      `${LOCAL_PREFIX}profile`,
    ]),
    deleteAccount: vi.fn(async () => {}),
  });

  it("purge PUIS supprime : un compte parti ne peut plus purger", async () => {
    const d = deps();
    const order: string[] = [];
    d.purgeRemote.mockImplementation(async () => {
      order.push("remote");
      return 3;
    });
    d.purgeLocal.mockImplementation(() => {
      order.push("local");
      return [];
    });
    d.deleteAccount.mockImplementation(async () => {
      order.push("account");
    });

    const report = await runAccountDeletion(d);

    expect(order).toEqual(["remote", "local", "account"]);
    expect(report.outcome).toBe("deleted");
  });

  it("compte ce qui est parti", async () => {
    const report = await runAccountDeletion(deps());
    expect(report).toEqual({
      outcome: "deleted",
      remoteDocs: 3,
      localKeys: 2,
    });
  });

  it("`auth/requires-recent-login` : les données sont parties, pas le compte", async () => {
    // Le cas qu'un invité ne peut PAS résoudre : aucune identité à
    // représenter. Ce n'est donc pas une erreur — c'est une issue partielle,
    // et la purge a bien eu lieu avant.
    const d = deps();
    d.deleteAccount.mockRejectedValue(
      firebaseError("auth/requires-recent-login"),
    );

    const report = await runAccountDeletion(d);

    expect(report.outcome).toBe("data-erased-only");
    expect(report.remoteDocs).toBe(3);
    expect(d.purgeRemote).toHaveBeenCalledOnce();
    expect(d.purgeLocal).toHaveBeenCalledOnce();
    expect(outcomeMessageKey(report.outcome)).toBe(
      "account.deleteDoneNoAccount",
    );
  });

  it("toute autre erreur de suppression remonte", async () => {
    const d = deps();
    d.deleteAccount.mockRejectedValue(
      firebaseError("auth/network-request-failed"),
    );
    await expect(runAccountDeletion(d)).rejects.toMatchObject({
      code: "auth/network-request-failed",
    });
  });

  it("une purge distante en échec n'est jamais prise pour une réussite", async () => {
    const d = deps();
    d.purgeRemote.mockRejectedValue(new Error("permission-denied"));
    await expect(runAccountDeletion(d)).rejects.toThrow("permission-denied");
    // Et surtout : on n'a pas supprimé le compte, donc on peut réessayer.
    expect(d.deleteAccount).not.toHaveBeenCalled();
  });
});

describe("purgeLocalData", () => {
  let store: Storage;

  beforeEach(() => {
    const map = new Map<string, string>();
    store = {
      get length() {
        return map.size;
      },
      key: (i: number) => [...map.keys()][i] ?? null,
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
      removeItem: (k: string) => void map.delete(k),
      clear: () => map.clear(),
    } as Storage;
  });

  it("retire les clés de l'app, garde la langue et les clés étrangères", () => {
    store.setItem(`${LOCAL_PREFIX}quizzes`, "[]");
    store.setItem(`${LOCAL_PREFIX}profile`, "{}");
    store.setItem(`${LOCAL_PREFIX}ai-settings`, '{"keys":{"gemini":"sk-…"}}');
    store.setItem(`${LOCAL_PREFIX}lang`, '{"state":{"lang":"es"}}');
    store.setItem("theme", "dark");

    const removed = purgeLocalData(store);

    expect(removed).toHaveLength(3);
    expect(store.getItem(`${LOCAL_PREFIX}ai-settings`)).toBeNull();
    // La langue n'est pas une donnée de compte : la purger renverrait au
    // français quelqu'un qui vient de lire l'avertissement en espagnol.
    expect(KEPT_LOCAL_KEYS).toContain(`${LOCAL_PREFIX}lang`);
    expect(store.getItem(`${LOCAL_PREFIX}lang`)).not.toBeNull();
    expect(store.getItem("theme")).toBe("dark");
  });

  it("efface TOUTES les clés préfixées, pas une sur deux", () => {
    // Retirer pendant le parcours décale les index : le piège classique.
    for (let i = 0; i < 6; i += 1) {
      store.setItem(`${LOCAL_PREFIX}k${i}`, String(i));
    }
    expect(purgeLocalData(store)).toHaveLength(6);
    expect(store.length).toBe(0);
  });
});
