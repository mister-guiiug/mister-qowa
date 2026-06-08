import { randomInt } from "node:crypto";
import { rtdb } from "./admin";
import { PIN_LENGTH } from "../../../shared/gameState";

function randomPin(): string {
  let pin = "";
  for (let i = 0; i < PIN_LENGTH; i += 1) pin += randomInt(0, 10).toString();
  return pin;
}

/**
 * Alloue un PIN unique via transaction sur `pins/{pin}` (pose le sessionId
 * seulement si le PIN est libre). D7 : 8 chiffres -> faible densité de collision.
 */
export async function allocatePin(sessionId: string): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const pin = randomPin();
    const res = await rtdb
      .ref(`pins/${pin}`)
      .transaction((cur) => (cur === null ? sessionId : undefined));
    if (res.committed && res.snapshot.val() === sessionId) return pin;
  }
  throw new Error("Impossible d’allouer un PIN unique");
}
