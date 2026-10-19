import type { Player, PlayerScore, Roster, RosterAnalysis } from "@/utils/fantasyEngine";

export interface RosterRow {
  player: Player;
  score: PlayerScore;
  slotLabel: string;
  isStarter: boolean;
}

/**
 * Orders a roster the way every table in the product shows it: the engine's
 * optimal starters in slot order, then the bench by projected points, with IR
 * players last.
 */
export function buildRosterRows(roster: Roster, analysis: RosterAnalysis): RosterRow[] {
  const scoreById = new Map(analysis.scores.map((score) => [score.playerId, score]));
  const starterSlots = new Map(analysis.lineup.starters.map((starter) => [starter.playerId, starter.slot]));
  const rows: RosterRow[] = [];

  for (const starter of analysis.lineup.starters) {
    const player = roster.players.find((candidate) => candidate.id === starter.playerId);
    const score = scoreById.get(starter.playerId);
    if (player && score) rows.push({ player, score, slotLabel: starter.slot, isStarter: true });
  }

  const bench = roster.players
    .filter((player) => !starterSlots.has(player.id))
    .map((player) => ({ player, score: scoreById.get(player.id) }))
    .filter((entry): entry is { player: Player; score: PlayerScore } => entry.score !== undefined)
    .sort((a, b) => {
      const aIr = a.player.injury.status === "IR" ? 1 : 0;
      const bIr = b.player.injury.status === "IR" ? 1 : 0;
      if (aIr !== bIr) return aIr - bIr;
      return b.score.projectedPoints - a.score.projectedPoints;
    });

  for (const entry of bench) {
    rows.push({ ...entry, slotLabel: entry.player.injury.status === "IR" ? "IR" : "BN", isStarter: false });
  }
  return rows;
}
