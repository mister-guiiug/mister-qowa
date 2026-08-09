import { describe, it, expect, beforeEach } from "vitest";
import {
  addBreadcrumb,
  dumpBreadcrumbs,
  clearBreadcrumbs,
} from "./breadcrumbs";

describe("breadcrumbs", () => {
  beforeEach(() => clearBreadcrumbs());

  it("conserve l'ordre d'insertion et le contenu", () => {
    addBreadcrumb("host", "nextQuestion#0");
    addBreadcrumb("route", "/play/x");
    const d = dumpBreadcrumbs();
    expect(d.map((b) => b.msg)).toEqual(["nextQuestion#0", "/play/x"]);
    expect(d[0]!.cat).toBe("host");
    expect(typeof d[0]!.ts).toBe("number");
  });

  it("borne le buffer aux 30 dernières miettes (éviction FIFO)", () => {
    for (let i = 0; i < 50; i += 1) addBreadcrumb("t", `m${i}`);
    const d = dumpBreadcrumbs();
    expect(d).toHaveLength(30);
    expect(d[0]!.msg).toBe("m20"); // les 20 premières sont évincées
    expect(d[29]!.msg).toBe("m49");
  });

  it("dumpBreadcrumbs renvoie une copie immuable", () => {
    addBreadcrumb("a", "1");
    const d = dumpBreadcrumbs();
    d.push({ ts: 0, cat: "x", msg: "y" });
    expect(dumpBreadcrumbs()).toHaveLength(1); // le buffer interne intact
  });
});
