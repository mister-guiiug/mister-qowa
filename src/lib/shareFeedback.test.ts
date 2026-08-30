import { describe, expect, it } from "vitest";
import { shareInfoKey } from "./shareFeedback";

/**
 * LE CAS QUI MOTIVE TOUT LE MODULE. La copie locale de `shareOrCopy` renvoyait
 * `'failed'` dès que `navigator.share` levait — ce qu'il fait AUSSI quand
 * l'utilisateur ferme la feuille de partage. L'hôte affichait donc
 * « Partage indisponible » à quelqu'un qui avait juste changé d'avis.
 *
 * Le socle distingue `'cancelled'`, et ce test tient la conséquence côté app.
 */
describe("shareInfoKey", () => {
  it("ne dit RIEN quand l'utilisateur annule", () => {
    expect(shareInfoKey("cancelled")).toBeNull();
  });

  it("ne dit rien non plus quand le partage natif a abouti", () => {
    expect(shareInfoKey("shared")).toBeNull();
  });

  it("annonce la copie, seule issue qu'aucun écran ne montre", () => {
    expect(shareInfoKey("copied")).toBe("host.linkCopied");
  });

  it("signale l'échec réel", () => {
    expect(shareInfoKey("failed")).toBe("host.shareUnavailable");
  });
});
