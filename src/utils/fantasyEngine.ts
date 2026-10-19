/**
 * FantasyShield Simulation Engine
 * --------------------------------
 * Pure, deterministic TypeScript. No I/O, no randomness, no framework
 * dependencies, so it runs identically inside a Route Handler and in the
 * browser. Every number the dashboard shows is produced here.
 *
 * Scoring model (0-100 scales):
 *   - Volume score     : recency-weighted opportunities (targets / carries /
 *                        dropbacks) against a positional baseline.
 *   - Schedule score   : remaining strength of schedule derived from each
 *                        opponent's fantasy points allowed to the position.
 *   - Injury risk      : mapped from the injury report, escalated for long
 *                        multi-week absences.
 *   - TD sustainability: actual touchdowns vs. the touchdowns a player's
 *                        touch volume "should" have produced.
 *   - Composite        : weighted blend of volume, schedule and health.
 */

import {
  getByeWeek,
  getDefenseRank,
  getMatchup,
  NFL_TEAMS,
  TEAM_NAMES,
} from "@/data/teams";
import { FREE_AGENT_POOL } from "@/data/players";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type Position = "QB" | "RB" | "WR" | "TE" | "K" | "DST";

export const POSITIONS: readonly Position[] = ["QB", "RB", "WR", "TE", "K", "DST"];

export type NFLTeam =
  | "ARI" | "ATL" | "BAL" | "BUF" | "CAR" | "CHI" | "CIN" | "CLE"
  | "DAL" | "DEN" | "DET" | "GB"  | "HOU" | "IND" | "JAX" | "KC"
  | "LAC" | "LAR" | "LV"  | "MIA" | "MIN" | "NE"  | "NO"  | "NYG"
  | "NYJ" | "PHI" | "PIT" | "SEA" | "SF"  | "TB"  | "TEN" | "WAS";

export type InjuryStatus = "Healthy" | "Questionable" | "Doubtful" | "Out" | "IR";

export const INJURY_STATUSES: readonly InjuryStatus[] = [
  "Healthy",
  "Questionable",
  "Doubtful",
  "Out",
  "IR",
];

export type RosterSlot = "Starter" | "Bench" | "IR";

export type RosterSource = "upload" | "paste" | "espn" | "yahoo" | "sample";

export interface WeeklyUsage {
  week: number;
  /** Share of offensive (or defensive) snaps played, 0-1. */
  snapShare: number;
  targets: number;
  carries: number;
  passAttempts: number;
  touchdowns: number;
  fantasyPoints: number;
}

export interface InjuryReport {
  status: InjuryStatus;
  /** Short description, e.g. "hamstring". */
  detail: string;
  /** Expected additional weeks missed. 0 for healthy or game-time decisions. */
  weeksOut: number;
}

export interface Player {
  id: string;
  name: string;
  position: Position;
  team: NFLTeam;
  byeWeek: number;
  injury: InjuryReport;
  /** The last N weeks of usage, oldest first. */
  usage: WeeklyUsage[];
  seasonTouchdowns: number;
  /** Season-to-date opportunities (targets + carries, or dropbacks for QBs). */
  seasonOpportunities: number;
  /** Percentage of leagues (0-100) in which the player is rostered. */
  rosteredPct: number;
  /** Player id of the starter this player backs up, when applicable. */
  handcuffFor?: string;
  slot: RosterSlot;
}

export interface Roster {
  leagueName: string;
  teamName: string;
  source: RosterSource;
  players: Player[];
  importedAt: string;
}

export type ActionType = "SELL_HIGH" | "BUY_LOW" | "DROP" | "PICK_UP";

export const ACTION_TYPES: readonly ActionType[] = [
  "SELL_HIGH",
  "BUY_LOW",
  "DROP",
  "PICK_UP",
];

export type ActionPriority = 1 | 2 | 3;

export interface ActionItem {
  id: string;
  type: ActionType;
  player: Player;
  /** 0-100 confidence that acting on this item improves the team. */
  confidence: number;
  priority: ActionPriority;
  headline: string;
  reasons: string[];
  tags: string[];
  /** Estimated weekly fantasy-point swing from executing the move. */
  projectedWeeklySwing: number;
  /**
   * A related player for the move: the counter-piece to offer in a trade, the
   * drop that makes room for a pickup, or the pickup that replaces a drop.
   */
  counterpart?: { name: string; position: Position; team: NFLTeam; label: string };
}

export type Trend = "rising" | "falling" | "stable";

export type LineupSlot = "QB" | "RB" | "WR" | "TE" | "FLEX" | "K" | "DST";

export interface PlayerScore {
  playerId: string;
  volumeScore: number;
  /** Recent opportunities per game, recency weighted. */
  weightedOpportunities: number;
  /** Change in opportunities between the last two and the previous two weeks. */
  opportunityDelta: number;
  /** Change in snap share between the first and last tracked week, 0-1 scale. */
  snapDelta: number;
  scheduleScore: number;
  nextThreeScheduleScore: number;
  /** Defensive rank (1 = toughest) of the next opponent. null on a bye. */
  nextOpponent: { team: NFLTeam; rank: number } | null;
  injuryRisk: number;
  expectedTouchdowns: number;
  tdRatio: number;
  weightedPoints: number;
  /** Expected fantasy points this week after matchup, bye and injury adjustments. */
  projectedPoints: number;
  composite: number;
  trend: Trend;
}

export type HealthGrade = "A" | "B" | "C" | "D" | "F";

export interface HealthIndex {
  overall: number;
  grade: HealthGrade;
  volume: number;
  schedule: number;
  injury: number;
  depth: number;
  summary: string;
}

export interface Lineup {
  starters: Array<{ slot: LineupSlot; playerId: string }>;
  bench: string[];
  /** Bench players the engine would start over a player currently flagged as a Starter. */
  swaps: Array<{ benchPlayerId: string; starterPlayerId: string; slot: LineupSlot; pointSwing: number }>;
}

export interface RosterAnalysis {
  generatedAt: string;
  currentWeek: number;
  weeksRemaining: number;
  health: HealthIndex;
  scores: PlayerScore[];
  lineup: Lineup;
  actions: ActionItem[];
}

export interface DefenseProfile {
  /** Average fantasy points allowed per game to each position. */
  QB: number;
  RB: number;
  WR: number;
  TE: number;
  K: number;
  DST: number;
}

/* -------------------------------------------------------------------------- */
/*                                  Config                                    */
/* -------------------------------------------------------------------------- */

export interface EngineConfig {
  currentWeek: number;
  seasonWeeks: number;
  /** Most recent week first. Must sum to 1. */
  recencyWeights: readonly number[];
  /** Opportunities per game that earn a volume score of 100. */
  volumeBaseline: Record<Position, number>;
  /** Sustainable touchdowns per opportunity. */
  tdRate: Record<Position, number>;
  injuryRisk: Record<InjuryStatus, number>;
  compositeWeights: { volume: number; schedule: number; health: number };
  thresholds: {
    sellHighTdRatio: number;
    buyLowTdRatio: number;
    brutalScheduleScore: number;
    favorableScheduleScore: number;
    risingSnapDelta: number;
    risingOpportunityDelta: number;
    /** Bench players below this volume score are clutter unless their role is growing. */
    clutterVolumeScore: number;
    /** Bench players below this composite score are clutter regardless of trend. */
    clutterComposite: number;
    /** Players rostered in this share of leagues or more are never drop candidates unless hurt long-term. */
    protectedRosteredPct: number;
    longTermInjuryWeeks: number;
    pickupMaxRostered: number;
    buyLowMinRostered: number;
    easyMatchupRank: number;
    hardMatchupRank: number;
  };
  perColumnLimit: number;
  lineupSlots: readonly LineupSlot[];
}

export const ENGINE_CONFIG: EngineConfig = {
  currentWeek: 7,
  seasonWeeks: 18,
  recencyWeights: [0.4, 0.3, 0.2, 0.1],
  volumeBaseline: { QB: 40, RB: 22, WR: 11, TE: 8, K: 12, DST: 12 },
  tdRate: { QB: 0.055, RB: 0.045, WR: 0.065, TE: 0.07, K: 0, DST: 0 },
  injuryRisk: { Healthy: 0, Questionable: 35, Doubtful: 65, Out: 85, IR: 100 },
  compositeWeights: { volume: 0.45, schedule: 0.25, health: 0.3 },
  thresholds: {
    sellHighTdRatio: 1.35,
    buyLowTdRatio: 0.7,
    brutalScheduleScore: 32,
    favorableScheduleScore: 64,
    risingSnapDelta: 0.08,
    risingOpportunityDelta: 2.5,
    clutterVolumeScore: 35,
    clutterComposite: 48,
    protectedRosteredPct: 75,
    longTermInjuryWeeks: 4,
    pickupMaxRostered: 50,
    buyLowMinRostered: 50,
    easyMatchupRank: 24,
    hardMatchupRank: 8,
  },
  perColumnLimit: 6,
  lineupSlots: ["QB", "RB", "RB", "WR", "WR", "WR", "TE", "FLEX", "K", "DST"],
};

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

export function round(value: number, digits = 1): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function opportunitiesFor(usage: WeeklyUsage, position: Position): number {
  switch (position) {
    case "QB":
      return usage.passAttempts + usage.carries;
    case "RB":
    case "WR":
    case "TE":
      return usage.targets + usage.carries;
    case "K":
    case "DST":
      return usage.fantasyPoints;
  }
}

function recencyWeighted(values: number[]): number {
  if (values.length === 0) return 0;
  const weights = ENGINE_CONFIG.recencyWeights;
  const recentFirst = [...values].reverse().slice(0, weights.length);
  let total = 0;
  let weightSum = 0;
  recentFirst.forEach((value, index) => {
    total += value * weights[index];
    weightSum += weights[index];
  });
  return weightSum === 0 ? 0 : total / weightSum;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** "toughest", "2nd-toughest", ... for a defensive rank (1 = toughest). */
export function describeToughness(rank: number): string {
  return rank === 1 ? "toughest" : `${ordinal(rank)}-toughest`;
}

/** "easiest", "2nd-easiest", ... for a defensive rank (32 = easiest). */
export function describeEase(rank: number): string {
  const fromBottom = NFL_TEAMS.length - rank + 1;
  return fromBottom === 1 ? "easiest" : `${ordinal(fromBottom)}-easiest`;
}

export function gradeFor(score: number): HealthGrade {
  if (score >= 85) return "A";
  if (score >= 72) return "B";
  if (score >= 60) return "C";
  if (score >= 48) return "D";
  return "F";
}

export function remainingSchedule(team: NFLTeam, fromWeek: number, toWeek: number): Array<{ week: number; opponent: NFLTeam | null }> {
  const games: Array<{ week: number; opponent: NFLTeam | null }> = [];
  for (let week = fromWeek; week <= toWeek; week++) {
    games.push({ week, opponent: getMatchup(team, week) });
  }
  return games;
}

/** Converts a defensive rank (1 = toughest) into a 0-100 "ease" score. */
export function rankToScore(rank: number): number {
  return ((rank - 1) / (NFL_TEAMS.length - 1)) * 100;
}

function scheduleScoreFor(team: NFLTeam, position: Position, fromWeek: number, toWeek: number): number {
  const games = remainingSchedule(team, fromWeek, toWeek);
  const played = games.filter((game): game is { week: number; opponent: NFLTeam } => game.opponent !== null);
  if (played.length === 0) return 50;
  const scores = played.map((game) => rankToScore(getDefenseRank(game.opponent, position)));
  return average(scores);
}

/* -------------------------------------------------------------------------- */
/*                               Player scoring                               */
/* -------------------------------------------------------------------------- */

export function scorePlayer(player: Player, currentWeek: number = ENGINE_CONFIG.currentWeek): PlayerScore {
  const { position, team, usage } = player;
  const config = ENGINE_CONFIG;
  const endWeek = config.seasonWeeks;

  const opportunitySeries = usage.map((week) => opportunitiesFor(week, position));
  const weightedOpportunities = recencyWeighted(opportunitySeries);
  const volumeScore = clamp((weightedOpportunities / config.volumeBaseline[position]) * 100);

  const half = Math.floor(opportunitySeries.length / 2);
  const earlier = average(opportunitySeries.slice(0, half));
  const later = average(opportunitySeries.slice(half));
  const opportunityDelta = opportunitySeries.length >= 2 ? later - earlier : 0;

  const snapDelta = usage.length >= 2 ? usage[usage.length - 1].snapShare - usage[0].snapShare : 0;

  const scheduleScore = scheduleScoreFor(team, position, currentWeek, endWeek);
  const nextThreeScheduleScore = scheduleScoreFor(team, position, currentWeek, Math.min(endWeek, currentWeek + 2));
  const nextOpponentTeam = getMatchup(team, currentWeek);
  const nextOpponent = nextOpponentTeam
    ? { team: nextOpponentTeam, rank: getDefenseRank(nextOpponentTeam, position) }
    : null;

  let injuryRisk = config.injuryRisk[player.injury.status];
  if (player.injury.weeksOut > 0) {
    injuryRisk = clamp(injuryRisk + Math.min(player.injury.weeksOut, 6) * 2.5);
  }

  const expectedTouchdowns = player.seasonOpportunities * config.tdRate[position];
  const tdRatio =
    position === "K" || position === "DST"
      ? 1
      : player.seasonTouchdowns / Math.max(expectedTouchdowns, 0.5);

  const weightedPoints = recencyWeighted(usage.map((week) => week.fantasyPoints));

  let projectedPoints = 0;
  if (nextOpponent && player.injury.status !== "IR" && player.injury.status !== "Out") {
    const matchupFactor = 0.85 + (rankToScore(nextOpponent.rank) / 100) * 0.3;
    const healthFactor = 1 - (injuryRisk / 100) * 0.6;
    projectedPoints = weightedPoints * matchupFactor * healthFactor;
  }

  const composite = clamp(
    volumeScore * config.compositeWeights.volume +
      scheduleScore * config.compositeWeights.schedule +
      (100 - injuryRisk) * config.compositeWeights.health,
  );

  let trend: Trend = "stable";
  const risingVolume = opportunityDelta >= config.thresholds.risingOpportunityDelta;
  const risingSnaps = snapDelta >= config.thresholds.risingSnapDelta;
  const fallingVolume = opportunityDelta <= -config.thresholds.risingOpportunityDelta;
  const fallingSnaps = snapDelta <= -config.thresholds.risingSnapDelta;
  if (risingVolume || risingSnaps) trend = "rising";
  if (fallingVolume || fallingSnaps) trend = "falling";

  return {
    playerId: player.id,
    volumeScore: round(volumeScore),
    weightedOpportunities: round(weightedOpportunities),
    opportunityDelta: round(opportunityDelta),
    snapDelta: round(snapDelta, 3),
    scheduleScore: round(scheduleScore),
    nextThreeScheduleScore: round(nextThreeScheduleScore),
    nextOpponent,
    injuryRisk: round(injuryRisk),
    expectedTouchdowns: round(expectedTouchdowns),
    tdRatio: round(tdRatio, 2),
    weightedPoints: round(weightedPoints),
    projectedPoints: round(projectedPoints),
    composite: round(composite),
    trend,
  };
}

/* -------------------------------------------------------------------------- */
/*                                   Lineup                                   */
/* -------------------------------------------------------------------------- */

const FLEX_ELIGIBLE: readonly Position[] = ["RB", "WR", "TE"];

/**
 * Builds the legal lineup with the most projected points for the configured
 * slot layout and reports the swaps needed to get there from the roster's
 * current Starter flags.
 */
export function buildLineup(players: Player[], scores: PlayerScore[]): Lineup {
  const scoreById = new Map(scores.map((score) => [score.playerId, score]));
  const projected = (id: string): number => scoreById.get(id)?.projectedPoints ?? 0;
  const available = players
    .filter((player) => player.injury.status !== "IR" && player.injury.status !== "Out")
    .sort((a, b) => projected(b.id) - projected(a.id));

  const used = new Set<string>();
  const starters: Lineup["starters"] = [];

  for (const slot of ENGINE_CONFIG.lineupSlots) {
    const eligible: readonly Position[] = slot === "FLEX" ? FLEX_ELIGIBLE : [slot];
    const pick = available.find((player) => !used.has(player.id) && eligible.includes(player.position));
    if (pick) {
      used.add(pick.id);
      starters.push({ slot, playerId: pick.id });
    }
  }

  const bench = players.filter((player) => !used.has(player.id)).map((player) => player.id);

  const swaps: Lineup["swaps"] = [];
  const currentStarters = players.filter((player) => player.slot === "Starter");
  for (const starter of starters) {
    const optimal = players.find((player) => player.id === starter.playerId);
    if (!optimal || optimal.slot === "Starter") continue;
    const eligible: readonly Position[] = starter.slot === "FLEX" ? FLEX_ELIGIBLE : [starter.slot];
    const displaced = currentStarters
      .filter((player) => eligible.includes(player.position) && !used.has(player.id) && !swaps.some((swap) => swap.starterPlayerId === player.id))
      .sort((a, b) => projected(a.id) - projected(b.id))[0];
    if (!displaced) continue;
    const pointSwing = round(projected(optimal.id) - projected(displaced.id));
    if (pointSwing <= 0) continue;
    swaps.push({
      benchPlayerId: optimal.id,
      starterPlayerId: displaced.id,
      slot: starter.slot,
      pointSwing,
    });
  }

  return { starters, bench, swaps };
}

/* -------------------------------------------------------------------------- */
/*                                Health index                                */
/* -------------------------------------------------------------------------- */

export function computeHealthIndex(players: Player[], scores: PlayerScore[], lineup: Lineup): HealthIndex {
  const scoreById = new Map(scores.map((score) => [score.playerId, score]));
  const starterIds = new Set(lineup.starters.map((starter) => starter.playerId));
  const starterScores = scores.filter((score) => starterIds.has(score.playerId));
  const benchScores = scores
    .filter((score) => !starterIds.has(score.playerId))
    .filter((score) => {
      const player = players.find((candidate) => candidate.id === score.playerId);
      return player !== undefined && player.position !== "K" && player.position !== "DST";
    })
    .sort((a, b) => b.composite - a.composite);

  const volume = average(starterScores.map((score) => score.volumeScore));
  const schedule = average(starterScores.map((score) => score.scheduleScore));

  let riskTotal = 0;
  let riskWeight = 0;
  for (const player of players) {
    const score = scoreById.get(player.id);
    if (!score) continue;
    const weight = starterIds.has(player.id) ? 1 : 0.4;
    riskTotal += score.injuryRisk * weight;
    riskWeight += weight;
  }
  const injury = riskWeight === 0 ? 100 : 100 - riskTotal / riskWeight;

  const topBench = benchScores.slice(0, 3).map((score) => score.composite);
  const filledSlots = lineup.starters.length / ENGINE_CONFIG.lineupSlots.length;
  const depth = clamp(average(topBench) * 0.8 + filledSlots * 20);

  const overall = clamp(volume * 0.4 + schedule * 0.2 + injury * 0.25 + depth * 0.15);
  const grade = gradeFor(overall);

  const weakest = [volume, schedule, injury, depth]
    .map((value, index) => ({ value, label: ["volume", "schedule", "health", "depth"][index] }))
    .sort((a, b) => a.value - b.value)[0];

  const summaryByGrade: Record<HealthGrade, string> = {
    A: "Championship-caliber roster. Protect the core and streamline the bench.",
    B: "Playoff-bound with a fixable weakness. Execute the priority moves below.",
    C: "Bubble team. Two or three sharp transactions change the season.",
    D: "At risk. Volume and health are leaking points every week.",
    F: "Emergency mode. Rebuild the starting lineup through the waiver wire now.",
  };

  return {
    overall: round(overall),
    grade,
    volume: round(volume),
    schedule: round(schedule),
    injury: round(injury),
    depth: round(depth),
    summary: `${summaryByGrade[grade]} Biggest drag right now: ${weakest.label}.`,
  };
}

/* -------------------------------------------------------------------------- */
/*                               Action engine                                */
/* -------------------------------------------------------------------------- */

function priorityFor(confidence: number): ActionPriority {
  if (confidence >= 75) return 1;
  if (confidence >= 55) return 2;
  return 3;
}

function describeNextThree(player: Player, currentWeek: number): string {
  const games = remainingSchedule(player.team, currentWeek, currentWeek + 2);
  const parts = games.map((game) =>
    game.opponent
      ? `${game.opponent} (#${getDefenseRank(game.opponent, player.position)} vs ${player.position})`
      : `BYE`,
  );
  return parts.join(", ");
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function sellHighItems(roster: Player[], scores: Map<string, PlayerScore>, currentWeek: number): ActionItem[] {
  const t = ENGINE_CONFIG.thresholds;
  const items: ActionItem[] = [];

  for (const player of roster) {
    const score = scores.get(player.id);
    if (!score) continue;
    if (player.position === "K" || player.position === "DST") continue;
    if (player.injury.status === "IR" || player.injury.status === "Out") continue;

    const tdInflated = score.tdRatio >= t.sellHighTdRatio;
    const brutal = score.nextThreeScheduleScore <= t.brutalScheduleScore;
    if (!tdInflated && !brutal) continue;
    // Nobody trades for a player without a role; require real market value.
    if (score.volumeScore < 45 || score.composite < 55) continue;

    const reasons: string[] = [];
    const tags: string[] = [];
    let confidence = 38;

    if (tdInflated) {
      const excess = score.tdRatio - 1;
      confidence += clamp(excess / 1.2, 0, 1) * 32;
      reasons.push(
        `${player.seasonTouchdowns} touchdowns on ${player.seasonOpportunities} opportunities; the usage supports about ${score.expectedTouchdowns.toFixed(1)}. Scoring is running ${score.tdRatio.toFixed(2)}x the sustainable rate.`,
      );
      tags.push("TD Regression");
    }
    if (brutal) {
      confidence += clamp((t.brutalScheduleScore - score.nextThreeScheduleScore) / t.brutalScheduleScore, 0, 1) * 24;
      reasons.push(`Next three: ${describeNextThree(player, currentWeek)}. Three-week schedule score of ${score.nextThreeScheduleScore}/100.`);
      tags.push("Brutal Schedule");
    }
    if (score.trend === "falling") {
      confidence += 8;
      reasons.push(`Opportunities are trending down (${score.opportunityDelta > 0 ? "+" : ""}${score.opportunityDelta} per game) while the box score still looks strong.`);
      tags.push("Fading Volume");
    }
    if (score.scheduleScore >= 50 && tdInflated) {
      reasons.push(`Trade value peaks now: ${score.weightedPoints} weighted points per game keeps the perceived value high.`);
    }

    confidence = clamp(confidence);
    items.push({
      id: `sell-${player.id}`,
      type: "SELL_HIGH",
      player,
      confidence: round(confidence, 0),
      priority: priorityFor(confidence),
      headline: tdInflated ? "Cash in before the touchdowns dry up" : "Move before the schedule turns",
      reasons,
      tags,
      projectedWeeklySwing: round(-(score.weightedPoints * (tdInflated ? 0.22 : 0.15))),
    });
  }

  return items.sort((a, b) => b.confidence - a.confidence);
}

function buyLowItems(pool: Player[], rosterIds: Set<string>, scores: Map<string, PlayerScore>, currentWeek: number): ActionItem[] {
  const t = ENGINE_CONFIG.thresholds;
  const items: ActionItem[] = [];

  for (const player of pool) {
    if (rosterIds.has(player.id)) continue;
    if (player.rosteredPct < t.buyLowMinRostered) continue;
    if (player.position === "K" || player.position === "DST") continue;
    if (player.injury.status === "IR") continue;
    const score = scores.get(player.id);
    if (!score) continue;

    const risingSnaps = score.snapDelta >= t.risingSnapDelta;
    const risingVolume = score.opportunityDelta >= t.risingOpportunityDelta;
    const favorable = score.scheduleScore >= t.favorableScheduleScore;
    const unluckyTds = score.tdRatio <= t.buyLowTdRatio && score.volumeScore >= 45;
    if (!risingSnaps && !risingVolume && !(favorable && score.volumeScore >= 40) && !unluckyTds) continue;

    const reasons: string[] = [];
    const tags: string[] = [];
    let confidence = 34;

    if (risingSnaps) {
      confidence += clamp(score.snapDelta / 0.25, 0, 1) * 22;
      const first = player.usage[0];
      const last = player.usage[player.usage.length - 1];
      reasons.push(`Snap share climbed from ${pct(first.snapShare)} in week ${first.week} to ${pct(last.snapShare)} in week ${last.week}.`);
      tags.push("Rising Snaps");
    }
    if (risingVolume) {
      confidence += clamp(score.opportunityDelta / 6, 0, 1) * 16;
      reasons.push(`Opportunities are up ${score.opportunityDelta} per game over the last two weeks (${score.weightedOpportunities} weighted per game).`);
      tags.push("Volume Spike");
    }
    if (favorable) {
      confidence += clamp((score.scheduleScore - 50) / 40, 0, 1) * 20;
      reasons.push(`Remaining schedule score ${score.scheduleScore}/100 for a ${player.position}; next three: ${describeNextThree(player, currentWeek)}.`);
      tags.push("Soft Schedule");
    }
    if (unluckyTds) {
      confidence += clamp((1 - score.tdRatio) / 0.7, 0, 1) * 18;
      reasons.push(`Only ${player.seasonTouchdowns} ${player.seasonTouchdowns === 1 ? "touchdown" : "touchdowns"} on usage that normally produces ${score.expectedTouchdowns.toFixed(1)}. Positive regression is coming.`);
      tags.push("TD Regression Up");
    }
    if (player.injury.status === "Questionable") {
      confidence -= 6;
      reasons.push(`Currently Questionable (${player.injury.detail}); the tag depresses the asking price.`);
      tags.push("Discounted");
    }

    confidence = clamp(confidence);
    items.push({
      id: `buy-${player.id}`,
      type: "BUY_LOW",
      player,
      confidence: round(confidence, 0),
      priority: priorityFor(confidence),
      headline:
        risingSnaps || risingVolume
          ? "Role is expanding faster than the box score"
          : favorable
            ? "Schedule and regression both point up"
            : "Touchdown luck is due to flip",
      reasons,
      tags,
      projectedWeeklySwing: round(score.weightedPoints * 0.2 + Math.max(score.opportunityDelta, 0) * 0.6),
    });
  }

  return items.sort((a, b) => b.confidence - a.confidence);
}

function dropItems(roster: Player[], scores: Map<string, PlayerScore>, lineup: Lineup, currentWeek: number): ActionItem[] {
  const t = ENGINE_CONFIG.thresholds;
  const starterIds = new Set(lineup.starters.map((starter) => starter.playerId));
  const rosterIds = new Set(roster.map((player) => player.id));
  const items: ActionItem[] = [];

  for (const player of roster) {
    const score = scores.get(player.id);
    if (!score) continue;
    if (starterIds.has(player.id)) continue;

    const protectsStarter = player.handcuffFor !== undefined && rosterIds.has(player.handcuffFor);
    const longTermInjury = player.injury.weeksOut >= t.longTermInjuryWeeks;
    const marketProtected = player.rosteredPct >= t.protectedRosteredPct;
    const clutter =
      !longTermInjury &&
      !marketProtected &&
      ((score.volumeScore < t.clutterVolumeScore && score.trend !== "rising") || score.composite < t.clutterComposite);
    const staleStreamer =
      (player.position === "K" || player.position === "DST") &&
      score.nextOpponent !== null &&
      score.nextOpponent.rank <= t.hardMatchupRank;

    if (protectsStarter && !longTermInjury) continue;
    if (!longTermInjury && !clutter && !staleStreamer) continue;

    const reasons: string[] = [];
    const tags: string[] = [];
    let confidence = 30;

    if (longTermInjury) {
      confidence += 30 + Math.min(player.injury.weeksOut, 8) * 3;
      reasons.push(`Listed ${player.injury.status} (${player.injury.detail}); roughly ${player.injury.weeksOut} more weeks out of a ${ENGINE_CONFIG.seasonWeeks - currentWeek + 1}-week runway.`);
      tags.push("Long-term Injury");
    }
    if (clutter) {
      confidence += 10 + Math.max(t.clutterVolumeScore - score.volumeScore, 0) * 1.3 + Math.max(t.clutterComposite - score.composite, 0) * 0.6;
      reasons.push(`Volume score ${score.volumeScore}/100 on ${score.weightedOpportunities} weighted opportunities per game; composite ${score.composite}/100. Not in the optimal lineup.`);
      tags.push("Bench Clutter");
    }
    if (staleStreamer && score.nextOpponent) {
      confidence += 20;
      reasons.push(`Next matchup is at ${score.nextOpponent.team}, the ${describeToughness(score.nextOpponent.rank)} defense for a ${player.position}.`);
      tags.push("Stale Streamer");
    }
    if (score.trend === "falling") {
      confidence += 8;
      reasons.push(`Usage is trending down: ${score.opportunityDelta} opportunities per game over the last two weeks.`);
    }
    if (player.byeWeek === currentWeek) {
      confidence += 4;
      reasons.push(`On bye this week, so the roster spot produces nothing.`);
    }

    confidence = clamp(confidence);
    items.push({
      id: `drop-${player.id}`,
      type: "DROP",
      player,
      confidence: round(confidence, 0),
      priority: priorityFor(confidence),
      headline: longTermInjury ? "Roster spot is dead weight for a month" : clutter ? "Bench clutter with no path to the lineup" : "Streaming window has closed",
      reasons,
      tags,
      projectedWeeklySwing: round(-score.weightedPoints * 0.05),
    });
  }

  return items.sort((a, b) => b.confidence - a.confidence);
}

function pickUpItems(pool: Player[], roster: Player[], scores: Map<string, PlayerScore>, currentWeek: number): ActionItem[] {
  const t = ENGINE_CONFIG.thresholds;
  const rosterById = new Map(roster.map((player) => [player.id, player]));
  const items: ActionItem[] = [];

  for (const player of pool) {
    if (rosterById.has(player.id)) continue;
    if (player.rosteredPct >= t.pickupMaxRostered) continue;
    if (player.injury.status === "IR" || player.injury.status === "Out") continue;
    const score = scores.get(player.id);
    if (!score) continue;

    const reasons: string[] = [];
    const tags: string[] = [];
    let confidence = score.composite * 0.45 + (100 - player.rosteredPct) * 0.12;

    const protectedStarter = player.handcuffFor ? rosterById.get(player.handcuffFor) : undefined;
    if (protectedStarter) {
      const starterScore = scores.get(protectedStarter.id);
      const starterHurt = protectedStarter.injury.status !== "Healthy";
      const gamesPlayed = Math.max(currentWeek - 1, 1);
      const roleSize = round(Math.max(protectedStarter.seasonOpportunities / gamesPlayed, starterScore?.weightedOpportunities ?? 0));
      confidence += starterHurt ? 26 : 12;
      reasons.push(
        `Direct handcuff for ${protectedStarter.name}${starterHurt ? ` (${protectedStarter.injury.status}: ${protectedStarter.injury.detail})` : ""}. One injury away from a ${roleSize}-touch-per-game role.`,
      );
      tags.push(starterHurt ? "Trending Handcuff" : "Handcuff");
    }
    const isUnit = player.position === "K" || player.position === "DST";

    if (score.snapDelta >= t.risingSnapDelta) {
      confidence += 14;
      const first = player.usage[0];
      const last = player.usage[player.usage.length - 1];
      reasons.push(`Snap share up from ${pct(first.snapShare)} to ${pct(last.snapShare)} over the last ${player.usage.length} weeks.`);
      tags.push("Rising Snaps");
    }
    if (score.opportunityDelta >= t.risingOpportunityDelta) {
      confidence += 10;
      reasons.push(
        isUnit
          ? `Scoring is up ${score.opportunityDelta} points per game over the last two weeks.`
          : `Opportunities are up ${score.opportunityDelta} per game over the last two weeks.`,
      );
      tags.push(isUnit ? "Hot Streak" : "Volume Spike");
    }
    if (score.nextOpponent && score.nextOpponent.rank >= t.easyMatchupRank) {
      confidence += 14;
      reasons.push(`Week ${currentWeek} vs ${score.nextOpponent.team}, the ${describeEase(score.nextOpponent.rank)} matchup for a ${player.position}.`);
      tags.push("Streamer");
    }
    if (score.scheduleScore >= t.favorableScheduleScore) {
      confidence += 8;
      reasons.push(`Remaining schedule score of ${score.scheduleScore}/100 keeps the spot useful beyond this week.`);
      tags.push("Soft Schedule");
    }
    if (player.rosteredPct <= 25) {
      reasons.push(`Rostered in ${player.rosteredPct}% of leagues. Available on most wires without a top waiver claim.`);
    } else {
      reasons.push(`Rostered in ${player.rosteredPct}% of leagues. Use a priority claim or FAAB; this one will not last.`);
      tags.push("Priority Waiver");
    }

    confidence = clamp(confidence);
    if (confidence < 45) continue;

    items.push({
      id: `pickup-${player.id}`,
      type: "PICK_UP",
      player,
      confidence: round(confidence, 0),
      priority: priorityFor(confidence),
      headline: protectedStarter
        ? "Insure your starter before someone else does"
        : score.nextOpponent && score.nextOpponent.rank >= t.easyMatchupRank
          ? "Immediate streamer with a plus matchup"
          : isUnit
            ? "Streaming upgrade with momentum"
            : "Ascending role on the waiver wire",
      reasons,
      tags,
      projectedWeeklySwing: round(score.weightedPoints * 0.35),
    });
  }

  return items.sort((a, b) => b.confidence - a.confidence);
}

function attachCounterparts(actions: ActionItem[], scores: Map<string, PlayerScore>): ActionItem[] {
  const sells = actions.filter((item) => item.type === "SELL_HIGH");
  const buys = actions.filter((item) => item.type === "BUY_LOW");
  const drops = actions.filter((item) => item.type === "DROP");
  const pickups = actions.filter((item) => item.type === "PICK_UP");

  const usedSells = new Set<string>();
  for (const buy of buys) {
    const target = scores.get(buy.player.id)?.composite ?? 0;
    const match = sells
      .filter((sell) => !usedSells.has(sell.id))
      .sort((a, b) => {
        const aDiff = Math.abs((scores.get(a.player.id)?.composite ?? 0) - target);
        const bDiff = Math.abs((scores.get(b.player.id)?.composite ?? 0) - target);
        return aDiff - bDiff;
      })[0];
    if (!match) continue;
    usedSells.add(match.id);
    buy.counterpart = { name: match.player.name, position: match.player.position, team: match.player.team, label: "Offer" };
    match.counterpart = { name: buy.player.name, position: buy.player.position, team: buy.player.team, label: "Ask for" };
  }

  const pairCount = Math.min(drops.length, pickups.length);
  for (let index = 0; index < pairCount; index++) {
    const drop = drops[index];
    const pickup = pickups[index];
    drop.counterpart = { name: pickup.player.name, position: pickup.player.position, team: pickup.player.team, label: "Replace with" };
    pickup.counterpart = { name: drop.player.name, position: drop.player.position, team: drop.player.team, label: "Drop" };
  }

  return actions;
}

/* -------------------------------------------------------------------------- */
/*                                Entry point                                 */
/* -------------------------------------------------------------------------- */

export interface AnalyzeOptions {
  currentWeek?: number;
  /** Players available in the league universe but not on the user's roster. */
  pool?: Player[];
  now?: Date;
}

export function analyzeRoster(roster: Roster, options: AnalyzeOptions = {}): RosterAnalysis {
  const currentWeek = options.currentWeek ?? ENGINE_CONFIG.currentWeek;
  const pool = options.pool ?? FREE_AGENT_POOL;
  const rosterIds = new Set(roster.players.map((player) => player.id));

  const universe = [...roster.players, ...pool.filter((player) => !rosterIds.has(player.id))];
  const scoreList = universe.map((player) => scorePlayer(player, currentWeek));
  const scores = new Map(scoreList.map((score) => [score.playerId, score]));

  const rosterScores = scoreList.filter((score) => rosterIds.has(score.playerId));
  const lineup = buildLineup(roster.players, rosterScores);
  const health = computeHealthIndex(roster.players, rosterScores, lineup);

  const limit = ENGINE_CONFIG.perColumnLimit;
  const actions = attachCounterparts(
    [
      ...sellHighItems(roster.players, scores, currentWeek).slice(0, limit),
      ...buyLowItems(pool, rosterIds, scores, currentWeek).slice(0, limit),
      ...dropItems(roster.players, scores, lineup, currentWeek).slice(0, limit),
      ...pickUpItems(pool, roster.players, scores, currentWeek).slice(0, limit),
    ],
    scores,
  );

  return {
    generatedAt: (options.now ?? new Date()).toISOString(),
    currentWeek,
    weeksRemaining: ENGINE_CONFIG.seasonWeeks - currentWeek + 1,
    health,
    scores: rosterScores,
    lineup,
    actions,
  };
}

/* -------------------------------------------------------------------------- */
/*                         Player construction helpers                        */
/* -------------------------------------------------------------------------- */

/** Baseline weekly usage for a position when real data is unavailable. */
export const BASELINE_USAGE: Record<Position, Omit<WeeklyUsage, "week">> = {
  QB: { snapShare: 1, targets: 0, carries: 3, passAttempts: 32, touchdowns: 1.5, fantasyPoints: 16.5 },
  RB: { snapShare: 0.55, targets: 3, carries: 11, passAttempts: 0, touchdowns: 0.5, fantasyPoints: 10.8 },
  WR: { snapShare: 0.7, targets: 6, carries: 0, passAttempts: 0, touchdowns: 0.4, fantasyPoints: 9.6 },
  TE: { snapShare: 0.68, targets: 4, carries: 0, passAttempts: 0, touchdowns: 0.3, fantasyPoints: 6.8 },
  K: { snapShare: 1, targets: 0, carries: 0, passAttempts: 0, touchdowns: 0, fantasyPoints: 7.5 },
  DST: { snapShare: 1, targets: 0, carries: 0, passAttempts: 0, touchdowns: 0.1, fantasyPoints: 6.5 },
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface SynthesizeInput {
  name: string;
  position: Position;
  team: NFLTeam;
  injury?: Partial<InjuryReport>;
  slot?: RosterSlot;
  rosteredPct?: number;
  usage?: WeeklyUsage[];
  seasonTouchdowns?: number;
  seasonOpportunities?: number;
  handcuffFor?: string;
  currentWeek?: number;
}

/**
 * Creates a fully populated Player from partial information, filling missing
 * usage with the positional baseline so the engine always has data to score.
 */
export function synthesizePlayer(input: SynthesizeInput): Player {
  const currentWeek = input.currentWeek ?? ENGINE_CONFIG.currentWeek;
  const weeks = ENGINE_CONFIG.recencyWeights.length;
  const baseline = BASELINE_USAGE[input.position];
  const usage =
    input.usage && input.usage.length > 0
      ? input.usage
      : Array.from({ length: weeks }, (_, index) => ({ week: currentWeek - weeks + index, ...baseline }));

  const gamesPlayed = Math.max(currentWeek - 1, 1);
  const perGameOpportunities = average(usage.map((week) => opportunitiesFor(week, input.position)));
  const perGameTouchdowns = average(usage.map((week) => week.touchdowns));

  return {
    id: `${slugify(input.name)}-${input.position.toLowerCase()}-${input.team.toLowerCase()}`,
    name: input.name,
    position: input.position,
    team: input.team,
    byeWeek: getByeWeek(input.team),
    injury: {
      status: input.injury?.status ?? "Healthy",
      detail: input.injury?.detail ?? "",
      weeksOut: input.injury?.weeksOut ?? 0,
    },
    usage,
    seasonTouchdowns: input.seasonTouchdowns ?? Math.round(perGameTouchdowns * gamesPlayed),
    seasonOpportunities: input.seasonOpportunities ?? Math.round(perGameOpportunities * gamesPlayed),
    rosteredPct: input.rosteredPct ?? 50,
    handcuffFor: input.handcuffFor,
    slot: input.slot ?? "Bench",
  };
}

export function teamDisplayName(team: NFLTeam): string {
  return TEAM_NAMES[team];
}

export function isPosition(value: string): value is Position {
  return (POSITIONS as readonly string[]).includes(value);
}

export function isNFLTeam(value: string): value is NFLTeam {
  return (NFL_TEAMS as readonly string[]).includes(value);
}

export function isInjuryStatus(value: string): value is InjuryStatus {
  return (INJURY_STATUSES as readonly string[]).includes(value);
}
