/** Mode équipe : équipes prédéfinies (couleurs du jeu) + classement agrégé. */

export interface Team {
  id: string;
  name: string;
  color: string;
}

export interface TeamStanding {
  teamId: string;
  name: string;
  color: string;
  total: number;
}

export const TEAM_PRESETS: Team[] = [
  { id: "red", name: "Rouge", color: "#e21b3c" },
  { id: "blue", name: "Bleu", color: "#1368ce" },
  { id: "yellow", name: "Jaune", color: "#d89e00" },
  { id: "green", name: "Vert", color: "#26890c" },
];

/** Renvoie les `count` premières équipes (borné 2..4). */
export function makeTeams(count: number): Team[] {
  return TEAM_PRESETS.slice(0, Math.min(4, Math.max(2, count)));
}
