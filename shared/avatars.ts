/** Palette d'avatars emoji FERMÉE (whitelist) — choisie à l'inscription. */
export const AVATARS = [
  "🦊",
  "🐼",
  "🐸",
  "🦄",
  "🐯",
  "🐙",
  "🐵",
  "🐧",
  "🦉",
  "🐝",
  "🐬",
  "🦁",
] as const;

export type Avatar = (typeof AVATARS)[number];

export function isAvatar(v: unknown): v is Avatar {
  return typeof v === "string" && (AVATARS as readonly string[]).includes(v);
}
