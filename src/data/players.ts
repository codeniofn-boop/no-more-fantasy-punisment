/**
 * Mock player universe. Every athlete here is fictional; the usage lines are
 * tuned so the engine surfaces a realistic spread of sell-high, buy-low, drop
 * and pickup candidates for the sample roster.
 */

import type {
  InjuryReport,
  NFLTeam,
  Player,
  Position,
  Roster,
  RosterSlot,
  WeeklyUsage,
} from "@/utils/fantasyEngine";
import { getByeWeek } from "@/data/teams";

const TRACKED_WEEKS = [3, 4, 5, 6] as const;

/** [snapShare, targets, carries, passAttempts, touchdowns, fantasyPoints] */
type UsageTuple = readonly [number, number, number, number, number, number];

interface PlayerSpec {
  name: string;
  position: Position;
  team: NFLTeam;
  usage: readonly [UsageTuple, UsageTuple, UsageTuple, UsageTuple];
  seasonTouchdowns: number;
  seasonOpportunities: number;
  rosteredPct: number;
  injury?: Partial<InjuryReport>;
  handcuffFor?: string;
  slot?: RosterSlot;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function playerIdFor(name: string, position: Position, team: NFLTeam): string {
  return `${slug(name)}-${position.toLowerCase()}-${team.toLowerCase()}`;
}

function toUsage(tuples: PlayerSpec["usage"]): WeeklyUsage[] {
  return tuples.map(([snapShare, targets, carries, passAttempts, touchdowns, fantasyPoints], index) => ({
    week: TRACKED_WEEKS[index],
    snapShare,
    targets,
    carries,
    passAttempts,
    touchdowns,
    fantasyPoints,
  }));
}

function build(spec: PlayerSpec): Player {
  return {
    id: playerIdFor(spec.name, spec.position, spec.team),
    name: spec.name,
    position: spec.position,
    team: spec.team,
    byeWeek: getByeWeek(spec.team),
    injury: {
      status: spec.injury?.status ?? "Healthy",
      detail: spec.injury?.detail ?? "",
      weeksOut: spec.injury?.weeksOut ?? 0,
    },
    usage: toUsage(spec.usage),
    seasonTouchdowns: spec.seasonTouchdowns,
    seasonOpportunities: spec.seasonOpportunities,
    rosteredPct: spec.rosteredPct,
    handcuffFor: spec.handcuffFor,
    slot: spec.slot ?? "Bench",
  };
}

/* ------------------------------ Sample roster ----------------------------- */

const SAMPLE_ROSTER_SPECS: PlayerSpec[] = [
  {
    name: "Marcus Delacroix",
    position: "QB",
    team: "DET",
    usage: [[1, 0, 4, 36, 2, 22.4], [1, 0, 3, 38, 3, 27.1], [1, 0, 5, 34, 2, 21.8], [1, 0, 4, 39, 2, 24.0]],
    seasonTouchdowns: 14,
    seasonOpportunities: 232,
    rosteredPct: 99,
    slot: "Starter",
  },
  {
    name: "Tobias Wren",
    position: "QB",
    team: "NYG",
    usage: [[1, 0, 2, 30, 1, 13.2], [1, 0, 3, 28, 1, 12.6], [1, 0, 2, 31, 0, 9.8], [1, 0, 1, 27, 1, 11.4]],
    seasonTouchdowns: 6,
    seasonOpportunities: 176,
    rosteredPct: 54,
  },
  {
    name: "Dante Okafor",
    position: "RB",
    team: "SF",
    usage: [[0.81, 5, 19, 0, 1, 21.6], [0.79, 6, 21, 0, 2, 27.3], [0.84, 4, 18, 0, 1, 19.1], [0.8, 7, 20, 0, 1, 22.8]],
    seasonTouchdowns: 7,
    seasonOpportunities: 148,
    rosteredPct: 100,
    slot: "Starter",
  },
  {
    name: "Kellan Pryce",
    position: "RB",
    team: "TEN",
    usage: [[0.66, 3, 15, 0, 2, 19.4], [0.64, 2, 16, 0, 2, 20.1], [0.62, 4, 14, 0, 1, 14.2], [0.6, 3, 13, 0, 2, 18.9]],
    seasonTouchdowns: 10,
    seasonOpportunities: 108,
    rosteredPct: 97,
    slot: "Starter",
  },
  {
    name: "Rashad Bellamy",
    position: "RB",
    team: "BUF",
    usage: [[0.58, 4, 12, 0, 0, 9.4], [0.55, 3, 11, 0, 1, 13.1], [0.33, 1, 6, 0, 0, 3.2], [0.1, 0, 2, 0, 0, 0.8]],
    seasonTouchdowns: 2,
    seasonOpportunities: 74,
    rosteredPct: 88,
    injury: { status: "Questionable", detail: "high-ankle sprain", weeksOut: 1 },
  },
  {
    name: "Owen Castellano",
    position: "RB",
    team: "LAR",
    usage: [[0.22, 1, 4, 0, 0, 2.1], [0.19, 0, 3, 0, 0, 1.4], [0.24, 2, 5, 0, 0, 3.6], [0.18, 1, 3, 0, 0, 1.9]],
    seasonTouchdowns: 0,
    seasonOpportunities: 27,
    rosteredPct: 41,
  },
  {
    name: "Jalen Mbeki",
    position: "RB",
    team: "HOU",
    usage: [[0.46, 3, 9, 0, 0, 7.2], [0.44, 2, 8, 0, 0, 6.1], [0.41, 2, 7, 0, 0, 4.9], [0.38, 1, 6, 0, 0, 3.8]],
    seasonTouchdowns: 1,
    seasonOpportunities: 58,
    rosteredPct: 63,
  },
  {
    name: "Elias Thornbury",
    position: "WR",
    team: "CIN",
    usage: [[0.92, 11, 0, 0, 1, 22.3], [0.9, 12, 1, 0, 1, 24.6], [0.91, 10, 0, 0, 0, 14.8], [0.93, 13, 0, 0, 1, 25.9]],
    seasonTouchdowns: 5,
    seasonOpportunities: 70,
    rosteredPct: 100,
    slot: "Starter",
  },
  {
    name: "Cyrus Vandenberg",
    position: "WR",
    team: "MIA",
    usage: [[0.84, 6, 0, 0, 2, 21.4], [0.82, 5, 0, 0, 1, 14.9], [0.85, 7, 0, 0, 2, 25.2], [0.83, 5, 0, 0, 1, 15.8]],
    seasonTouchdowns: 9,
    seasonOpportunities: 36,
    rosteredPct: 96,
    slot: "Starter",
  },
  {
    name: "Theo Amundsen",
    position: "WR",
    team: "BAL",
    usage: [[0.88, 8, 0, 0, 0, 11.2], [0.87, 9, 0, 0, 1, 17.4], [0.89, 7, 0, 0, 0, 9.8], [0.9, 9, 1, 0, 0, 12.6]],
    seasonTouchdowns: 2,
    seasonOpportunities: 52,
    rosteredPct: 94,
    slot: "Starter",
  },
  {
    name: "Isaiah Fontaine",
    position: "WR",
    team: "LAC",
    usage: [[0.71, 4, 0, 0, 0, 6.3], [0.68, 3, 0, 0, 0, 4.1], [0.52, 2, 0, 0, 0, 2.2], [0.47, 1, 0, 0, 0, 1.1]],
    seasonTouchdowns: 1,
    seasonOpportunities: 22,
    rosteredPct: 48,
  },
  {
    name: "Brennan Holloway",
    position: "WR",
    team: "GB",
    usage: [[0.74, 6, 0, 0, 1, 15.1], [0.76, 7, 0, 0, 0, 9.4], [0.78, 6, 0, 0, 1, 14.7], [0.8, 8, 0, 0, 0, 11.3]],
    seasonTouchdowns: 3,
    seasonOpportunities: 40,
    rosteredPct: 79,
  },
  {
    name: "Soren Lindqvist",
    position: "TE",
    team: "KC",
    usage: [[0.86, 8, 0, 0, 1, 16.2], [0.85, 7, 0, 0, 0, 8.9], [0.88, 9, 0, 0, 1, 17.6], [0.87, 8, 0, 0, 1, 15.4]],
    seasonTouchdowns: 4,
    seasonOpportunities: 48,
    rosteredPct: 99,
    slot: "Starter",
  },
  {
    name: "Gideon Marsh",
    position: "TE",
    team: "PIT",
    usage: [[0.7, 5, 0, 0, 0, 5.6], [0.0, 0, 0, 0, 0, 0], [0.0, 0, 0, 0, 0, 0], [0.0, 0, 0, 0, 0, 0]],
    seasonTouchdowns: 1,
    seasonOpportunities: 14,
    rosteredPct: 37,
    injury: { status: "IR", detail: "torn pectoral", weeksOut: 9 },
    slot: "IR",
  },
  {
    name: "Nikolai Brandt",
    position: "K",
    team: "NYJ",
    usage: [[1, 0, 0, 0, 0, 8.0], [1, 0, 0, 0, 0, 5.0], [1, 0, 0, 0, 0, 11.0], [1, 0, 0, 0, 0, 6.0]],
    seasonTouchdowns: 0,
    seasonOpportunities: 0,
    rosteredPct: 72,
    slot: "Starter",
  },
  {
    name: "Cleveland Browns D/ST",
    position: "DST",
    team: "CLE",
    usage: [[1, 0, 0, 0, 0, 9.0], [1, 0, 0, 0, 1, 14.0], [1, 0, 0, 0, 0, 4.0], [1, 0, 0, 0, 0, 7.0]],
    seasonTouchdowns: 1,
    seasonOpportunities: 0,
    rosteredPct: 81,
    slot: "Starter",
  },
];

/* ----------------------------- Free-agent pool ---------------------------- */

const FREE_AGENT_SPECS: PlayerSpec[] = [
  {
    name: "Ezekiel Haddad",
    position: "RB",
    team: "BUF",
    usage: [[0.28, 1, 5, 0, 0, 2.9], [0.31, 2, 6, 0, 0, 4.1], [0.58, 3, 13, 0, 1, 14.6], [0.83, 4, 18, 0, 1, 19.2]],
    seasonTouchdowns: 2,
    seasonOpportunities: 54,
    rosteredPct: 19,
    handcuffFor: playerIdFor("Rashad Bellamy", "RB", "BUF"),
  },
  {
    name: "Lucas Ferreira",
    position: "RB",
    team: "SF",
    usage: [[0.17, 1, 3, 0, 0, 1.8], [0.19, 1, 4, 0, 0, 2.3], [0.16, 0, 3, 0, 0, 1.2], [0.2, 2, 4, 0, 0, 3.0]],
    seasonTouchdowns: 0,
    seasonOpportunities: 25,
    rosteredPct: 31,
    handcuffFor: playerIdFor("Dante Okafor", "RB", "SF"),
  },
  {
    name: "Darius Quintrell",
    position: "RB",
    team: "CAR",
    usage: [[0.42, 2, 8, 0, 0, 5.4], [0.49, 3, 10, 0, 0, 7.8], [0.61, 4, 13, 0, 1, 15.3], [0.67, 5, 15, 0, 0, 12.1]],
    seasonTouchdowns: 1,
    seasonOpportunities: 72,
    rosteredPct: 44,
  },
  {
    name: "Amari Westbrook",
    position: "RB",
    team: "JAX",
    usage: [[0.62, 4, 14, 0, 0, 10.2], [0.65, 5, 15, 0, 0, 11.4], [0.68, 6, 16, 0, 0, 12.8], [0.7, 5, 17, 0, 1, 18.6]],
    seasonTouchdowns: 1,
    seasonOpportunities: 118,
    rosteredPct: 91,
  },
  {
    name: "Rowan Kipling",
    position: "RB",
    team: "DEN",
    usage: [[0.54, 3, 12, 0, 1, 14.4], [0.5, 2, 11, 0, 0, 7.9], [0.52, 3, 12, 0, 1, 13.6], [0.49, 2, 10, 0, 0, 6.8]],
    seasonTouchdowns: 4,
    seasonOpportunities: 84,
    rosteredPct: 86,
  },
  {
    name: "Mateo Villanueva",
    position: "WR",
    team: "ARI",
    usage: [[0.55, 4, 0, 0, 0, 6.2], [0.63, 6, 0, 0, 0, 8.9], [0.74, 8, 0, 0, 0, 10.7], [0.81, 9, 1, 0, 0, 12.4]],
    seasonTouchdowns: 1,
    seasonOpportunities: 46,
    rosteredPct: 67,
  },
  {
    name: "Jaxon Reyes-Whitfield",
    position: "WR",
    team: "ATL",
    usage: [[0.79, 9, 0, 0, 0, 11.8], [0.81, 8, 0, 0, 0, 9.6], [0.8, 10, 0, 0, 0, 13.1], [0.82, 9, 0, 0, 0, 10.9]],
    seasonTouchdowns: 1,
    seasonOpportunities: 58,
    rosteredPct: 83,
  },
  {
    name: "Quincy Oyelaran",
    position: "WR",
    team: "TEN",
    usage: [[0.38, 2, 0, 0, 0, 2.4], [0.47, 3, 0, 0, 0, 4.6], [0.66, 6, 0, 0, 1, 14.2], [0.78, 8, 0, 0, 0, 11.6]],
    seasonTouchdowns: 1,
    seasonOpportunities: 28,
    rosteredPct: 23,
  },
  {
    name: "Beau Lachance",
    position: "WR",
    team: "NO",
    usage: [[0.69, 5, 0, 0, 0, 7.1], [0.71, 6, 0, 0, 0, 8.3], [0.7, 7, 0, 0, 1, 15.2], [0.72, 6, 0, 0, 0, 7.9]],
    seasonTouchdowns: 2,
    seasonOpportunities: 36,
    rosteredPct: 38,
  },
  {
    name: "Idris Salahuddin",
    position: "WR",
    team: "SEA",
    usage: [[0.86, 7, 0, 0, 1, 16.3], [0.84, 6, 0, 0, 1, 14.8], [0.85, 7, 0, 0, 0, 9.2], [0.87, 8, 0, 0, 1, 17.1]],
    seasonTouchdowns: 5,
    seasonOpportunities: 42,
    rosteredPct: 95,
  },
  {
    name: "Harlan Voss",
    position: "WR",
    team: "WAS",
    usage: [[0.6, 4, 0, 0, 0, 5.1], [0.58, 3, 0, 0, 0, 3.9], [0.57, 4, 0, 0, 0, 4.8], [0.55, 3, 0, 0, 0, 3.4]],
    seasonTouchdowns: 0,
    seasonOpportunities: 22,
    rosteredPct: 12,
  },
  {
    name: "Felix Oduya",
    position: "TE",
    team: "IND",
    usage: [[0.58, 3, 0, 0, 0, 3.6], [0.64, 5, 0, 0, 0, 5.8], [0.77, 6, 0, 0, 1, 13.4], [0.83, 7, 0, 0, 0, 8.1]],
    seasonTouchdowns: 1,
    seasonOpportunities: 30,
    rosteredPct: 27,
  },
  {
    name: "Sebastian Krall",
    position: "TE",
    team: "DAL",
    usage: [[0.81, 6, 0, 0, 0, 7.4], [0.8, 7, 0, 0, 0, 8.2], [0.82, 6, 0, 0, 0, 6.9], [0.79, 7, 0, 0, 1, 13.8]],
    seasonTouchdowns: 1,
    seasonOpportunities: 40,
    rosteredPct: 76,
  },
  {
    name: "Malachi Greaves",
    position: "TE",
    team: "CAR",
    usage: [[0.66, 4, 0, 0, 0, 4.2], [0.65, 4, 0, 0, 0, 4.6], [0.67, 5, 0, 0, 0, 5.9], [0.66, 4, 0, 0, 0, 4.4]],
    seasonTouchdowns: 0,
    seasonOpportunities: 25,
    rosteredPct: 9,
  },
  {
    name: "Ander Lekuona",
    position: "QB",
    team: "ARI",
    usage: [[1, 0, 6, 31, 1, 16.9], [1, 0, 7, 33, 2, 21.2], [1, 0, 8, 35, 2, 23.8], [1, 0, 6, 36, 3, 26.4]],
    seasonTouchdowns: 10,
    seasonOpportunities: 228,
    rosteredPct: 46,
  },
  {
    name: "Cole Stratton",
    position: "QB",
    team: "PHI",
    usage: [[1, 0, 3, 33, 2, 19.5], [1, 0, 2, 35, 1, 15.2], [1, 0, 4, 32, 2, 20.1], [1, 0, 3, 34, 1, 14.9]],
    seasonTouchdowns: 11,
    seasonOpportunities: 212,
    rosteredPct: 88,
  },
  {
    name: "Rafael Montoya",
    position: "QB",
    team: "CHI",
    usage: [[1, 0, 2, 29, 1, 12.1], [1, 0, 1, 27, 0, 8.4], [1, 0, 2, 30, 1, 13.3], [1, 0, 2, 26, 1, 11.0]],
    seasonTouchdowns: 6,
    seasonOpportunities: 170,
    rosteredPct: 14,
  },
  {
    name: "Teodor Halvorsen",
    position: "K",
    team: "DAL",
    usage: [[1, 0, 0, 0, 0, 9.0], [1, 0, 0, 0, 0, 12.0], [1, 0, 0, 0, 0, 10.0], [1, 0, 0, 0, 0, 13.0]],
    seasonTouchdowns: 0,
    seasonOpportunities: 0,
    rosteredPct: 42,
  },
  {
    name: "Luka Petrovic",
    position: "K",
    team: "HOU",
    usage: [[1, 0, 0, 0, 0, 7.0], [1, 0, 0, 0, 0, 9.0], [1, 0, 0, 0, 0, 8.0], [1, 0, 0, 0, 0, 6.0]],
    seasonTouchdowns: 0,
    seasonOpportunities: 0,
    rosteredPct: 21,
  },
  {
    name: "Minnesota Vikings D/ST",
    position: "DST",
    team: "MIN",
    usage: [[1, 0, 0, 0, 0, 8.0], [1, 0, 0, 0, 1, 15.0], [1, 0, 0, 0, 0, 10.0], [1, 0, 0, 0, 0, 12.0]],
    seasonTouchdowns: 2,
    seasonOpportunities: 0,
    rosteredPct: 39,
  },
  {
    name: "Denver Broncos D/ST",
    position: "DST",
    team: "DEN",
    usage: [[1, 0, 0, 0, 0, 6.0], [1, 0, 0, 0, 0, 9.0], [1, 0, 0, 0, 0, 11.0], [1, 0, 0, 0, 1, 16.0]],
    seasonTouchdowns: 1,
    seasonOpportunities: 0,
    rosteredPct: 33,
  },
  {
    name: "Seattle Seahawks D/ST",
    position: "DST",
    team: "SEA",
    usage: [[1, 0, 0, 0, 0, 5.0], [1, 0, 0, 0, 0, 3.0], [1, 0, 0, 0, 0, 7.0], [1, 0, 0, 0, 0, 4.0]],
    seasonTouchdowns: 0,
    seasonOpportunities: 0,
    rosteredPct: 17,
  },
];

export const SAMPLE_ROSTER_PLAYERS: Player[] = SAMPLE_ROSTER_SPECS.map(build);
export const FREE_AGENT_POOL: Player[] = FREE_AGENT_SPECS.map(build);

/** Every known player, used for name matching when a roster is imported. */
export const PLAYER_UNIVERSE: Player[] = [...SAMPLE_ROSTER_PLAYERS, ...FREE_AGENT_POOL];

export function findKnownPlayer(name: string): Player | undefined {
  const normalized = slug(name);
  return PLAYER_UNIVERSE.find((player) => slug(player.name) === normalized);
}

export function buildSampleRoster(importedAt: string): Roster {
  return {
    leagueName: "Friends of the Shield (12-team PPR)",
    teamName: "Newton's Cradle",
    source: "sample",
    players: SAMPLE_ROSTER_PLAYERS.map((player) => ({
      ...player,
      injury: { ...player.injury },
      usage: player.usage.map((week) => ({ ...week })),
    })),
    importedAt,
  };
}
