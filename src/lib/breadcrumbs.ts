/**
 * Fil d'Ariane (« breadcrumbs ») : ring buffer EN MÉMOIRE des dernières actions
 * (transitions host, route, soumissions, échecs RTDB), joint au payload de
 * reportError pour savoir « que faisait l'utilisateur juste avant » l'erreur.
 *
 * Borné, sans persistance, 100 % client (Spark). JAMAIS de PII (pas de pseudo/
 * PIN brut) — uniquement des étiquettes techniques (qid, index, chemin).
 */
export interface Breadcrumb {
  ts: number;
  cat: string;
  msg: string;
}

const MAX = 30;
let buffer: Breadcrumb[] = [];

/** Ajoute une miette ; le buffer reste borné aux MAX dernières (éviction FIFO). */
export function addBreadcrumb(cat: string, msg: string): void {
  buffer.push({ ts: Date.now(), cat, msg });
  if (buffer.length > MAX) buffer = buffer.slice(-MAX);
}

/** Copie immuable du fil courant (pour le payload d'erreur / le diagnostic). */
export function dumpBreadcrumbs(): Breadcrumb[] {
  return buffer.slice();
}

/** Vide le fil (tests). */
export function clearBreadcrumbs(): void {
  buffer = [];
}
