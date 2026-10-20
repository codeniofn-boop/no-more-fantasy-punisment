/**
 * League universe: 32 NFL franchises, their positional defense profiles, and a
 * deterministic 18-week schedule with 8 bye weeks (weeks 5-12, four teams
 * each). Pairings come from the circle method, so no two teams meet twice, and
 * bye groups are chosen from that week's own pairings so every team sits out
 * exactly once without orphaning an opponent.
 */

import type { DefenseProfile, NFLTeam, Position } from "@/utils/fantasyEngine";

export const NFL_TEAMS: readonly NFLTeam[] = [
  "ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE",
  "DAL", "DEN", "DET", "GB",  "HOU", "IND", "JAX", "KC",
  "LAC", "LAR", "LV",  "MIA", "MIN", "NE",  "NO",  "NYG",
  "NYJ", "PHI", "PIT", "SEA", "SF",  "TB",  "TEN", "WAS",
];

export const TEAM_NAMES: Record<NFLTeam, string> = {
  ARI: "Arizona Cardinals",
  ATL: "Atlanta Falcons",
  BAL: "Baltimore Ravens",
  BUF: "Buffalo Bills",
  CAR: "Carolina Panthers",
  CHI: "Chicago Bears",
  CIN: "Cincinnati Bengals",
  CLE: "Cleveland Browns",
  DAL: "Dallas Cowboys",
  DEN: "Denver Broncos",
  DET: "Detroit Lions",
  GB: "Green Bay Packers",
  HOU: "Houston Texans",
  IND: "Indianapolis Colts",
  JAX: "Jacksonville Jaguars",
  KC: "Kansas City Chiefs",
  LAC: "Los Angeles Chargers",
  LAR: "Los Angeles Rams",
  LV: "Las Vegas Raiders",
  MIA: "Miami Dolphins",
  MIN: "Minnesota Vikings",
  NE: "New England Patriots",
  NO: "New Orleans Saints",
  NYG: "New York Giants",
  NYJ: "New York Jets",
  PHI: "Philadelphia Eagles",
  PIT: "Pittsburgh Steelers",
  SEA: "Seattle Seahawks",
  SF: "San Francisco 49ers",
  TB: "Tampa Bay Buccaneers",
  TEN: "Tennessee Titans",
  WAS: "Washington Commanders",
};

/** Alternate spellings accepted by the roster parsers. */
export const TEAM_ALIASES: Record<string, NFLTeam> = {
  ARZ: "ARI",
  CARDINALS: "ARI",
  FALCONS: "ATL",
  RAVENS: "BAL",
  BILLS: "BUF",
  PANTHERS: "CAR",
  BEARS: "CHI",
  BENGALS: "CIN",
  BROWNS: "CLE",
  COWBOYS: "DAL",
  BRONCOS: "DEN",
  LIONS: "DET",
  GNB: "GB",
  PACKERS: "GB",
  TEXANS: "HOU",
  COLTS: "IND",
  JAC: "JAX",
  JAGUARS: "JAX",
  KAN: "KC",
  CHIEFS: "KC",
  SD: "LAC",
  CHARGERS: "LAC",
  STL: "LAR",
  RAMS: "LAR",
  OAK: "LV",
  LVR: "LV",
  RAIDERS: "LV",
  DOLPHINS: "MIA",
  VIKINGS: "MIN",
  NWE: "NE",
  PATRIOTS: "NE",
  NOR: "NO",
  SAINTS: "NO",
  GIANTS: "NYG",
  JETS: "NYJ",
  EAGLES: "PHI",
  STEELERS: "PIT",
  SEAHAWKS: "SEA",
  SFO: "SF",
  "49ERS": "SF",
  NINERS: "SF",
  TAM: "TB",
  BUCCANEERS: "TB",
  BUCS: "TB",
  TITANS: "TEN",
  WSH: "WAS",
  COMMANDERS: "WAS",
};

/**
 * Average fantasy points allowed per game to each position. Lower numbers
 * mean a tougher defense for that position.
 */
export const DEFENSE_PROFILES: Record<NFLTeam, DefenseProfile> = {
  ARI: { QB: 19.8, RB: 24.1, WR: 36.5, TE: 11.2, K: 8.9, DST: 7.1 },
  ATL: { QB: 18.4, RB: 21.7, WR: 31.9, TE: 9.8, K: 8.1, DST: 6.4 },
  BAL: { QB: 14.1, RB: 15.2, WR: 27.4, TE: 6.9, K: 6.2, DST: 4.1 },
  BUF: { QB: 15.3, RB: 17.9, WR: 28.8, TE: 7.4, K: 6.9, DST: 4.9 },
  CAR: { QB: 21.6, RB: 26.3, WR: 37.2, TE: 12.4, K: 9.4, DST: 7.6 },
  CHI: { QB: 16.7, RB: 19.6, WR: 29.1, TE: 8.6, K: 7.3, DST: 5.6 },
  CIN: { QB: 19.2, RB: 22.8, WR: 33.6, TE: 10.9, K: 8.5, DST: 6.8 },
  CLE: { QB: 14.9, RB: 18.4, WR: 26.2, TE: 7.9, K: 6.6, DST: 4.4 },
  DAL: { QB: 20.5, RB: 23.4, WR: 34.8, TE: 10.1, K: 8.7, DST: 7.3 },
  DEN: { QB: 15.8, RB: 16.6, WR: 27.9, TE: 7.2, K: 6.4, DST: 4.6 },
  DET: { QB: 18.9, RB: 20.2, WR: 32.4, TE: 9.3, K: 7.9, DST: 6.1 },
  GB: { QB: 16.2, RB: 19.1, WR: 29.7, TE: 8.4, K: 7.1, DST: 5.4 },
  HOU: { QB: 15.5, RB: 18.8, WR: 28.3, TE: 8.1, K: 6.8, DST: 5.1 },
  IND: { QB: 18.1, RB: 22.3, WR: 31.2, TE: 10.4, K: 8.3, DST: 6.6 },
  JAX: { QB: 20.9, RB: 23.9, WR: 35.1, TE: 11.6, K: 9.1, DST: 7.4 },
  KC: { QB: 16.9, RB: 17.4, WR: 30.3, TE: 7.7, K: 7.0, DST: 5.3 },
  LAC: { QB: 15.1, RB: 19.9, WR: 27.1, TE: 8.9, K: 6.5, DST: 4.8 },
  LAR: { QB: 17.8, RB: 21.2, WR: 30.8, TE: 9.6, K: 7.7, DST: 6.2 },
  LV: { QB: 19.5, RB: 23.1, WR: 33.2, TE: 11.9, K: 8.6, DST: 6.9 },
  MIA: { QB: 18.7, RB: 20.6, WR: 32.1, TE: 9.1, K: 8.0, DST: 6.3 },
  MIN: { QB: 16.4, RB: 16.1, WR: 29.4, TE: 8.2, K: 6.7, DST: 5.2 },
  NE: { QB: 19.9, RB: 22.1, WR: 33.9, TE: 10.7, K: 8.4, DST: 6.7 },
  NO: { QB: 20.2, RB: 24.6, WR: 34.3, TE: 11.4, K: 8.8, DST: 7.0 },
  NYG: { QB: 17.3, RB: 21.9, WR: 30.1, TE: 9.9, K: 7.6, DST: 5.9 },
  NYJ: { QB: 14.6, RB: 17.1, WR: 25.8, TE: 7.0, K: 6.3, DST: 4.3 },
  PHI: { QB: 16.0, RB: 18.1, WR: 28.6, TE: 7.6, K: 6.9, DST: 5.0 },
  PIT: { QB: 15.6, RB: 17.7, WR: 27.6, TE: 7.5, K: 6.6, DST: 4.7 },
  SEA: { QB: 17.1, RB: 20.9, WR: 31.5, TE: 9.4, K: 7.5, DST: 5.8 },
  SF: { QB: 15.9, RB: 16.9, WR: 28.1, TE: 7.3, K: 6.8, DST: 5.0 },
  TB: { QB: 18.6, RB: 15.6, WR: 32.9, TE: 10.2, K: 7.8, DST: 6.0 },
  TEN: { QB: 21.1, RB: 25.4, WR: 36.0, TE: 12.1, K: 9.2, DST: 7.5 },
  WAS: { QB: 17.6, RB: 22.6, WR: 31.0, TE: 10.6, K: 8.2, DST: 6.5 },
};

export const SEASON_WEEKS = 18;
export const BYE_WEEK_START = 5;
export const BYE_WEEK_END = 12;
const TEAMS_PER_BYE_WEEK = 4;

/* --------------------------- Defensive rankings --------------------------- */

function buildRankTable(): Record<Position, Record<NFLTeam, number>> {
  const positions: Position[] = ["QB", "RB", "WR", "TE", "K", "DST"];
  const table = {} as Record<Position, Record<NFLTeam, number>>;
  for (const position of positions) {
    const ordered = [...NFL_TEAMS].sort((a, b) => {
      const diff = DEFENSE_PROFILES[a][position] - DEFENSE_PROFILES[b][position];
      return diff !== 0 ? diff : a.localeCompare(b);
    });
    const ranks = {} as Record<NFLTeam, number>;
    ordered.forEach((team, index) => {
      ranks[team] = index + 1;
    });
    table[position] = ranks;
  }
  return table;
}

const RANK_TABLE = buildRankTable();

/** 1 = fewest fantasy points allowed to the position (toughest), 32 = most. */
export function getDefenseRank(team: NFLTeam, position: Position): number {
  return RANK_TABLE[position][team];
}

export function getDefenseProfile(team: NFLTeam): DefenseProfile {
  return DEFENSE_PROFILES[team];
}

/* -------------------------------- Schedule -------------------------------- */

/**
 * Circle-method round used for each week (index 0 = week 1). The circle method
 * on 32 teams yields 31 distinct perfect matchings; bye weeks 5-12 are mapped
 * to rounds whose pairings can be partitioned into bye groups (a modular-sum
 * argument rules out eight consecutive rounds), and the remaining weeks take
 * the unused rounds in order.
 */
const WEEK_ROUNDS: readonly number[] = [8, 9, 10, 12, 1, 2, 3, 4, 5, 6, 7, 11, 13, 14, 15, 16, 17, 18];

function circlePairings(week: number): Array<[number, number]> {
  const n = NFL_TEAMS.length;
  const rotation = (WEEK_ROUNDS[week - 1] - 1) % (n - 1);
  const others: number[] = [];
  for (let index = 1; index < n; index++) others.push(index);
  const rotated = others.slice(rotation).concat(others.slice(0, rotation));
  const arranged = [0, ...rotated];
  const pairs: Array<[number, number]> = [];
  for (let index = 0; index < n / 2; index++) {
    pairs.push([arranged[index], arranged[n - 1 - index]]);
  }
  return pairs;
}

/**
 * Chooses, for each bye week, two of that week's circle pairings whose four
 * teams sit out. Backtracking guarantees every team lands in exactly one bye
 * group; the search is deterministic so the schedule is stable across runs.
 */
function assignByeWeeks(): Record<NFLTeam, number> {
  const byeWeeks = BYE_WEEK_END - BYE_WEEK_START + 1;
  const pairsPerWeek = TEAMS_PER_BYE_WEEK / 2;
  const assignment = {} as Record<NFLTeam, number>;
  const assigned = new Set<number>();

  const solve = (weekIndex: number): boolean => {
    if (weekIndex === byeWeeks) return assigned.size === NFL_TEAMS.length;
    const week = BYE_WEEK_START + weekIndex;
    const pairs = circlePairings(week).filter(([a, b]) => !assigned.has(a) && !assigned.has(b));

    const pick = (start: number, chosen: Array<[number, number]>): boolean => {
      if (chosen.length === pairsPerWeek) {
        for (const [a, b] of chosen) {
          assigned.add(a);
          assigned.add(b);
          assignment[NFL_TEAMS[a]] = week;
          assignment[NFL_TEAMS[b]] = week;
        }
        if (solve(weekIndex + 1)) return true;
        for (const [a, b] of chosen) {
          assigned.delete(a);
          assigned.delete(b);
        }
        return false;
      }
      for (let index = start; index < pairs.length; index++) {
        const [a, b] = pairs[index];
        if (chosen.some(([x, y]) => x === a || x === b || y === a || y === b)) continue;
        if (pick(index + 1, [...chosen, pairs[index]])) return true;
      }
      return false;
    };

    return pick(0, []);
  };

  if (!solve(0)) {
    throw new Error("FantasyShield schedule: unable to assign bye weeks");
  }
  return assignment;
}

const BYE_ASSIGNMENT = assignByeWeeks();

export function getByeWeek(team: NFLTeam): number {
  return BYE_ASSIGNMENT[team];
}

function buildSchedule(): Record<NFLTeam, Array<NFLTeam | null>> {
  const schedule = {} as Record<NFLTeam, Array<NFLTeam | null>>;
  for (const team of NFL_TEAMS) schedule[team] = new Array<NFLTeam | null>(SEASON_WEEKS + 1).fill(null);

  for (let week = 1; week <= SEASON_WEEKS; week++) {
    for (const [a, b] of circlePairings(week)) {
      const teamA = NFL_TEAMS[a];
      const teamB = NFL_TEAMS[b];
      if (BYE_ASSIGNMENT[teamA] === week || BYE_ASSIGNMENT[teamB] === week) continue;
      schedule[teamA][week] = teamB;
      schedule[teamB][week] = teamA;
    }
  }

  return schedule;
}

const SCHEDULE = buildSchedule();

/** Opponent for the week, or null on a bye / outside the season. */
export function getMatchup(team: NFLTeam, week: number): NFLTeam | null {
  if (week < 1 || week > SEASON_WEEKS) return null;
  return SCHEDULE[team][week];
}

export function getSeasonSchedule(team: NFLTeam): Array<{ week: number; opponent: NFLTeam | null }> {
  const games: Array<{ week: number; opponent: NFLTeam | null }> = [];
  for (let week = 1; week <= SEASON_WEEKS; week++) {
    games.push({ week, opponent: SCHEDULE[team][week] });
  }
  return games;
}
