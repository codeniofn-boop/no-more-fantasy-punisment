/**
 * Mock league import. Given a provider and league id, deterministically
 * assembles a legal roster from the engine's player universe so the same id
 * always returns the same team.
 */

import { PLAYER_UNIVERSE } from "@/data/players";
import type { Player, Position, Roster } from "@/utils/fantasyEngine";

export type LeagueProvider = "espn" | "yahoo";

export const LEAGUE_PROVIDERS: readonly LeagueProvider[] = ["espn", "yahoo"];

export const LEAGUE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]{2,23}$/;

export const PROVIDER_LABELS: Record<LeagueProvider, string> = {
  espn: "ESPN",
  yahoo: "Yahoo",
};

export function isLeagueProvider(value: string): value is LeagueProvider {
  return (LEAGUE_PROVIDERS as readonly string[]).includes(value);
}

function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

const ROSTER_SHAPE: Array<{ position: Position; count: number; starters: number }> = [
  { position: "QB", count: 2, starters: 1 },
  { position: "RB", count: 5, starters: 2 },
  { position: "WR", count: 5, starters: 3 },
  { position: "TE", count: 2, starters: 1 },
  { position: "K", count: 1, starters: 1 },
  { position: "DST", count: 1, starters: 1 },
];

const ADJECTIVES = ["Velvet", "Iron", "Midnight", "Crimson", "Electric", "Golden", "Frozen", "Neon", "Savage", "Quantum", "Hollow", "Silent", "Atomic", "Royal"];
const NOUNS = ["Hammers", "Comets", "Wolves", "Monarchs", "Pirates", "Titans", "Outlaws", "Engines", "Serpents", "Nomads", "Ravagers", "Sentinels", "Phantoms", "Jackals"];

function clone(player: Player): Player {
  return {
    ...player,
    injury: { ...player.injury },
    usage: player.usage.map((week) => ({ ...week })),
  };
}

export function buildLeagueRoster(provider: LeagueProvider, leagueId: string, importedAt: string): Roster {
  const random = mulberry32(fnv1a(`${provider}:${leagueId.toLowerCase()}`));
  const players: Player[] = [];
  const flexCandidates: Player[] = [];

  for (const shape of ROSTER_SHAPE) {
    const pool = PLAYER_UNIVERSE.filter((player) => player.position === shape.position);
    const chosen = shuffle(pool, random)
      .slice(0, shape.count)
      .map(clone)
      .sort((a, b) => b.rosteredPct - a.rosteredPct);
    let startersAssigned = 0;
    for (const player of chosen) {
      if (player.injury.status === "IR") {
        player.slot = "IR";
      } else if (startersAssigned < shape.starters) {
        player.slot = "Starter";
        startersAssigned += 1;
      } else {
        player.slot = "Bench";
        if (shape.position === "RB" || shape.position === "WR" || shape.position === "TE") flexCandidates.push(player);
      }
    }
    players.push(...chosen);
  }

  const flex = flexCandidates.sort((a, b) => b.rosteredPct - a.rosteredPct)[0];
  if (flex) flex.slot = "Starter";

  const adjective = ADJECTIVES[Math.floor(random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(random() * NOUNS.length)];
  const leagueSize = random() < 0.5 ? 10 : 12;

  return {
    leagueName: `${PROVIDER_LABELS[provider]} League ${leagueId} (${leagueSize}-team)`,
    teamName: `${adjective} ${noun}`,
    source: provider,
    players,
    importedAt,
  };
}
