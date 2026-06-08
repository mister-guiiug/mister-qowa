/**
 * Normalisation des réponses libres — fonction UNIQUE partagée client + serveur (D9).
 * On ne hashe JAMAIS une réponse libre « pour la sécurité » (faux sens) : on ne
 * fait que comparer des formes normalisées.
 */

const DIACRITICS = /[̀-ͯ]/g;

export function normalizeFreeText(
  input: string,
  caseSensitive = false,
): string {
  let out = input.trim().normalize("NFKD").replace(DIACRITICS, "");
  if (!caseSensitive) out = out.toLowerCase();
  return out.replace(/\s+/g, " ");
}

export function freeTextMatches(
  answer: string,
  accepted: readonly string[],
  caseSensitive = false,
): boolean {
  const a = normalizeFreeText(answer, caseSensitive);
  return accepted.some((x) => normalizeFreeText(x, caseSensitive) === a);
}
