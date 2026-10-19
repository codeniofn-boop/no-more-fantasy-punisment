/**
 * Roster ingestion: turns JSON, CSV or free-form text into fully populated
 * Player records. Known players (from the engine database) are matched by
 * name; unknown players are synthesized from positional baselines so the
 * engine can still score them.
 */

import { findKnownPlayer } from "@/data/players";
import { getDefenseRank, getMatchup, NFL_TEAMS, TEAM_ALIASES, TEAM_NAMES } from "@/data/teams";
import {
  ENGINE_CONFIG,
  isInjuryStatus,
  isNFLTeam,
  isPosition,
  rankToScore,
  synthesizePlayer,
  type InjuryStatus,
  type NFLTeam,
  type Player,
  type Position,
  type RosterSlot,
  type RosterSource,
  type WeeklyUsage,
} from "@/utils/fantasyEngine";

export type RosterInputFormat = "json" | "csv" | "text";

export interface PlayerDraft {
  name: string;
  position?: Position;
  team?: NFLTeam;
  injuryStatus?: InjuryStatus;
  injuryDetail?: string;
  weeksOut?: number;
  slot?: RosterSlot;
  rosteredPct?: number;
  usage?: WeeklyUsage[];
  seasonTouchdowns?: number;
  seasonOpportunities?: number;
  handcuffFor?: string;
  /** Where the draft came from, used in warnings ("line 4", "row 2"). */
  sourceLabel: string;
}

export interface ParseResult {
  format: RosterInputFormat;
  players: Player[];
  warnings: string[];
  errors: string[];
  leagueName?: string;
  teamName?: string;
  source?: RosterSource;
}

/* ------------------------------ Token tables ------------------------------ */

const POSITION_TOKENS: Record<string, Position> = {
  QB: "QB",
  RB: "RB",
  HB: "RB",
  FB: "RB",
  WR: "WR",
  TE: "TE",
  K: "K",
  PK: "K",
  DST: "DST",
  DEF: "DST",
  DEFENSE: "DST",
  "D/ST": "DST",
};

const STATUS_WORDS: Record<string, InjuryStatus> = {
  HEALTHY: "Healthy",
  ACTIVE: "Healthy",
  PROBABLE: "Healthy",
  QUESTIONABLE: "Questionable",
  DOUBTFUL: "Doubtful",
  OUT: "Out",
  IR: "IR",
  "IR-R": "IR",
  PUP: "IR",
  NFI: "IR",
  INJURED: "IR",
};

/** Short tags only honoured inside parentheses, e.g. "(Q)". */
const STATUS_TAGS: Record<string, InjuryStatus> = {
  ...STATUS_WORDS,
  P: "Healthy",
  Q: "Questionable",
  D: "Doubtful",
  O: "Out",
};

const SLOT_TOKENS: Record<string, RosterSlot> = {
  STARTER: "Starter",
  STARTERS: "Starter",
  START: "Starter",
  STARTING: "Starter",
  FLEX: "Starter",
  BENCH: "Bench",
  BN: "Bench",
  BE: "Bench",
  RESERVE: "Bench",
  IR: "IR",
};

const DEFAULT_WEEKS_OUT: Record<InjuryStatus, number> = {
  Healthy: 0,
  Questionable: 0,
  Doubtful: 1,
  Out: 2,
  IR: 6,
};

function normalizeToken(token: string): string {
  return token.toUpperCase().replace(/[^A-Z0-9/-]/g, "");
}

export function resolvePositionToken(value: string | undefined): Position | undefined {
  if (!value) return undefined;
  const key = normalizeToken(value);
  return POSITION_TOKENS[key];
}

export function resolveTeamToken(value: string | undefined): NFLTeam | undefined {
  if (!value) return undefined;
  const key = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (isNFLTeam(key)) return key;
  const alias = TEAM_ALIASES[key];
  if (alias) return alias;
  const full = value.trim().toLowerCase();
  const match = (Object.keys(TEAM_NAMES) as NFLTeam[]).find((team) => TEAM_NAMES[team].toLowerCase() === full);
  return match;
}

export function resolveStatusToken(value: string | undefined, allowShort = false): InjuryStatus | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (isInjuryStatus(trimmed)) return trimmed;
  const key = normalizeToken(trimmed);
  return allowShort ? STATUS_TAGS[key] : STATUS_WORDS[key];
}

export function resolveSlotToken(value: string | undefined): RosterSlot | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed === "Starter" || trimmed === "Bench" || trimmed === "IR") return trimmed;
  return SLOT_TOKENS[normalizeToken(trimmed)];
}

/* ------------------------------ Draft -> Player --------------------------- */

const neutralTeamCache = new Map<Position, NFLTeam>();

/** The team whose remaining schedule is closest to league average for the position. */
export function neutralTeamFor(position: Position): NFLTeam {
  const cached = neutralTeamCache.get(position);
  if (cached) return cached;
  let best: NFLTeam = NFL_TEAMS[0];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const team of NFL_TEAMS) {
    const scores: number[] = [];
    for (let week = ENGINE_CONFIG.currentWeek; week <= ENGINE_CONFIG.seasonWeeks; week++) {
      const opponent = getMatchup(team, week);
      if (opponent) scores.push(rankToScore(getDefenseRank(opponent, position)));
    }
    const mean = scores.reduce((sum, value) => sum + value, 0) / Math.max(scores.length, 1);
    const distance = Math.abs(mean - 50);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = team;
    }
  }
  neutralTeamCache.set(position, best);
  return best;
}

function clonePlayer(player: Player): Player {
  return {
    ...player,
    injury: { ...player.injury },
    usage: player.usage.map((week) => ({ ...week })),
  };
}

interface ResolveContext {
  warnings: string[];
  errors: string[];
  synthesized: string[];
  seenIds: Set<string>;
}

function resolveDraft(draft: PlayerDraft, context: ResolveContext): Player | null {
  const name = draft.name.trim();
  if (!name) {
    context.errors.push(`${draft.sourceLabel}: no player name found.`);
    return null;
  }

  const known =
    findKnownPlayer(name) ??
    (draft.position === "DST" && draft.team ? findKnownPlayer(`${TEAM_NAMES[draft.team]} D/ST`) : undefined);

  let player: Player;
  if (known && !draft.usage) {
    player = clonePlayer(known);
    if (draft.position && draft.position !== known.position) {
      context.warnings.push(`${name}: listed as ${draft.position} but engine data has ${known.position}; using ${known.position}.`);
    }
    if (draft.team && draft.team !== known.team) {
      context.warnings.push(`${name}: listed with ${draft.team} but engine data has ${known.team}; using ${known.team}.`);
    }
    if (draft.slot) player.slot = draft.slot;
    if (draft.injuryStatus) {
      player.injury = {
        status: draft.injuryStatus,
        detail: draft.injuryDetail ?? (draft.injuryStatus === known.injury.status ? known.injury.detail : "per roster import"),
        weeksOut: draft.weeksOut ?? (draft.injuryStatus === known.injury.status ? known.injury.weeksOut : DEFAULT_WEEKS_OUT[draft.injuryStatus]),
      };
    }
    if (draft.rosteredPct !== undefined) player.rosteredPct = draft.rosteredPct;
  } else {
    if (!draft.position) {
      context.errors.push(`${draft.sourceLabel}: "${name}" is not in the engine database and no position was given. Add QB, RB, WR, TE, K or DST.`);
      return null;
    }
    let team = draft.team;
    if (!team) {
      team = neutralTeamFor(draft.position);
      context.warnings.push(`${name}: no NFL team given; using ${team} for a league-average schedule.`);
    }
    const status = draft.injuryStatus ?? "Healthy";
    player = synthesizePlayer({
      name: draft.position === "DST" && !name.toLowerCase().includes("d/st") ? `${TEAM_NAMES[team]} D/ST` : name,
      position: draft.position,
      team,
      injury: {
        status,
        detail: draft.injuryDetail ?? (status === "Healthy" ? "" : "per roster import"),
        weeksOut: draft.weeksOut ?? DEFAULT_WEEKS_OUT[status],
      },
      slot: draft.slot ?? (status === "IR" ? "IR" : "Bench"),
      rosteredPct: draft.rosteredPct,
      usage: draft.usage,
      seasonTouchdowns: draft.seasonTouchdowns,
      seasonOpportunities: draft.seasonOpportunities,
      handcuffFor: draft.handcuffFor,
    });
    if (!draft.usage) context.synthesized.push(player.name);
  }

  if (context.seenIds.has(player.id)) {
    context.warnings.push(`${player.name}: listed more than once; keeping the first entry.`);
    return null;
  }
  context.seenIds.add(player.id);
  return player;
}

function finalize(format: RosterInputFormat, drafts: PlayerDraft[], context: ResolveContext, extras: Partial<ParseResult> = {}): ParseResult {
  const players: Player[] = [];
  for (const draft of drafts) {
    const player = resolveDraft(draft, context);
    if (player) players.push(player);
  }
  if (context.synthesized.length > 0) {
    const names = context.synthesized.slice(0, 4).join(", ");
    const more = context.synthesized.length > 4 ? ` and ${context.synthesized.length - 4} more` : "";
    context.warnings.push(`${context.synthesized.length} player${context.synthesized.length === 1 ? "" : "s"} not in the engine database (${names}${more}) scored from positional baseline usage.`);
  }
  if (players.length === 0 && context.errors.length === 0) {
    context.errors.push("No players were found in the input.");
  }
  return { format, players, warnings: context.warnings, errors: context.errors, ...extras };
}

function newContext(): ResolveContext {
  return { warnings: [], errors: [], synthesized: [], seenIds: new Set() };
}

/* --------------------------------- Text ----------------------------------- */

type LineParse = { draft: PlayerDraft } | { error: string } | null;

export function parseTextLine(rawLine: string, lineNumber: number): LineParse {
  let line = rawLine.trim();
  if (!line) return null;
  line = line.replace(/^(?:[-*•▪◦>]+|\d+[.)])\s*/, "");
  if (!line) return null;

  const draft: PlayerDraft = { name: "", sourceLabel: `line ${lineNumber}` };

  const prefix = line.match(/^([A-Za-z/]+)\s*:\s*/);
  if (prefix) {
    const key = normalizeToken(prefix[1]);
    if (SLOT_TOKENS[key]) {
      draft.slot = SLOT_TOKENS[key];
      line = line.slice(prefix[0].length);
    } else if (POSITION_TOKENS[key]) {
      draft.slot = "Starter";
      draft.position = POSITION_TOKENS[key];
      line = line.slice(prefix[0].length);
    }
  }

  line = line.replace(/\(([^)]*)\)|\[([^\]]*)\]/g, (_match, parenInner: string | undefined, bracketInner: string | undefined) => {
    const inner = (parenInner ?? bracketInner ?? "").trim();
    const status = resolveStatusToken(inner, true);
    if (status) {
      draft.injuryStatus = status;
      return " ";
    }
    return ` ${inner} `;
  });

  line = line.replace(/\bD\/ST\b/gi, "DST").replace(/\bDEF\b/gi, "DST");

  const tokens = line
    .split(/\s[-–—]\s|[,;|\t]+|\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const nameParts: string[] = [];
  for (const token of tokens) {
    const key = normalizeToken(token);
    if (!key) continue;
    if (!draft.position && POSITION_TOKENS[key]) {
      draft.position = POSITION_TOKENS[key];
      continue;
    }
    if (!draft.team) {
      const team = resolveTeamToken(token);
      if (team) {
        draft.team = team;
        continue;
      }
    }
    const status = STATUS_WORDS[key];
    if (status && nameParts.length > 0) {
      draft.injuryStatus = status;
      continue;
    }
    if (SLOT_TOKENS[key] && nameParts.length > 0 && key !== "IR") {
      draft.slot = SLOT_TOKENS[key];
      continue;
    }
    nameParts.push(token);
  }

  draft.name = nameParts.join(" ").replace(/\s+/g, " ").trim();
  if (draft.position === "DST" && draft.team) {
    draft.name = `${TEAM_NAMES[draft.team]} D/ST`;
  }
  if (!draft.name) {
    return { error: `line ${lineNumber}: could not find a player name in "${rawLine.trim()}".` };
  }
  if (draft.injuryStatus === "IR" && !draft.slot) draft.slot = "IR";
  return { draft };
}

export function parseRosterText(text: string): ParseResult {
  const context = newContext();
  const drafts: PlayerDraft[] = [];
  text.split(/\r?\n/).forEach((line, index) => {
    const result = parseTextLine(line, index + 1);
    if (!result) return;
    if ("error" in result) {
      context.errors.push(result.error);
      return;
    }
    drafts.push(result.draft);
  });
  return finalize("text", drafts, context, { source: "paste" });
}

/* ---------------------------------- CSV ----------------------------------- */

const COLUMN_ALIASES: Record<keyof Pick<PlayerDraft, "name" | "position" | "team" | "injuryStatus" | "slot" | "rosteredPct" | "injuryDetail" | "weeksOut">, string[]> = {
  name: ["name", "player", "player name", "playername", "full name", "fullname", "player_name"],
  position: ["position", "pos", "slot position"],
  team: ["team", "nfl team", "nflteam", "pro team", "proteam", "tm", "nfl"],
  injuryStatus: ["status", "injury", "injury status", "injurystatus", "health"],
  injuryDetail: ["injury detail", "injurydetail", "injury note", "note", "notes"],
  weeksOut: ["weeks out", "weeksout", "weeks_out"],
  slot: ["slot", "roster slot", "rosterslot", "lineup slot", "lineup", "roster"],
  rosteredPct: ["rostered", "rostered pct", "rosteredpct", "rostered %", "% rostered", "own", "owned", "% owned", "roster %", "ownership"],
};

export function detectDelimiter(line: string): string {
  const candidates = [",", "\t", ";", "|"];
  let best = ",";
  let bestCount = -1;
  for (const candidate of candidates) {
    const count = line.split(candidate).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = candidate;
    }
  }
  return best;
}

export function splitDelimited(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function parseNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const cleaned = value.replace(/[%\s,]/g, "");
  if (cleaned === "") return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseRosterCsv(text: string): ParseResult {
  const context = newContext();
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    context.errors.push("The CSV is empty.");
    return finalize("csv", [], context, { source: "upload" });
  }

  const delimiter = detectDelimiter(lines[0]);
  const headerCells = splitDelimited(lines[0], delimiter).map((cell) => cell.toLowerCase().replace(/[_-]+/g, " ").trim());
  const hasHeader = headerCells.some((cell) => COLUMN_ALIASES.name.includes(cell));

  const columnIndex: Partial<Record<keyof typeof COLUMN_ALIASES, number>> = {};
  if (hasHeader) {
    (Object.keys(COLUMN_ALIASES) as Array<keyof typeof COLUMN_ALIASES>).forEach((field) => {
      const index = headerCells.findIndex((cell) => COLUMN_ALIASES[field].includes(cell));
      if (index >= 0) columnIndex[field] = index;
    });
  } else {
    columnIndex.name = 0;
    columnIndex.position = 1;
    columnIndex.team = 2;
    columnIndex.injuryStatus = 3;
    columnIndex.slot = 4;
    context.warnings.push("No header row detected; reading columns as name, position, team, status, slot.");
  }

  const drafts: PlayerDraft[] = [];
  const rows = hasHeader ? lines.slice(1) : lines;
  rows.forEach((line, index) => {
    const rowNumber = index + (hasHeader ? 2 : 1);
    const cells = splitDelimited(line, delimiter);
    const cell = (field: keyof typeof COLUMN_ALIASES): string | undefined => {
      const position = columnIndex[field];
      return position === undefined ? undefined : cells[position];
    };
    const name = cell("name")?.trim();
    if (!name) {
      context.errors.push(`row ${rowNumber}: missing player name.`);
      return;
    }
    const position = resolvePositionToken(cell("position"));
    if (cell("position") && !position) {
      context.warnings.push(`row ${rowNumber}: unrecognised position "${cell("position")}" for ${name}.`);
    }
    const team = resolveTeamToken(cell("team"));
    if (cell("team") && !team) {
      context.warnings.push(`row ${rowNumber}: unrecognised team "${cell("team")}" for ${name}.`);
    }
    drafts.push({
      name,
      position,
      team,
      injuryStatus: resolveStatusToken(cell("injuryStatus"), true),
      injuryDetail: cell("injuryDetail") || undefined,
      weeksOut: parseNumber(cell("weeksOut")),
      slot: resolveSlotToken(cell("slot")),
      rosteredPct: parseNumber(cell("rosteredPct")),
      sourceLabel: `row ${rowNumber}`,
    });
  });

  return finalize("csv", drafts, context, { source: "upload" });
}

/* ---------------------------------- JSON ---------------------------------- */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickString(record: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return undefined;
}

function pickNumber(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = parseNumber(value);
      if (parsed !== undefined) return parsed;
    }
  }
  return undefined;
}

function usageFromUnknown(value: unknown, label: string, warnings: string[]): WeeklyUsage[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  const usage: WeeklyUsage[] = [];
  value.forEach((entry, index) => {
    if (!isRecord(entry)) return;
    const week = pickNumber(entry, ["week"]);
    const fantasyPoints = pickNumber(entry, ["fantasyPoints", "points", "pts"]);
    if (week === undefined || fantasyPoints === undefined) {
      warnings.push(`${label}: usage entry ${index + 1} is missing week or fantasyPoints and was skipped.`);
      return;
    }
    usage.push({
      week,
      snapShare: Math.min(Math.max(pickNumber(entry, ["snapShare", "snap_share", "snaps"]) ?? 0, 0), 1),
      targets: pickNumber(entry, ["targets", "tgt"]) ?? 0,
      carries: pickNumber(entry, ["carries", "rushes", "att"]) ?? 0,
      passAttempts: pickNumber(entry, ["passAttempts", "pass_attempts", "attempts"]) ?? 0,
      touchdowns: pickNumber(entry, ["touchdowns", "td", "tds"]) ?? 0,
      fantasyPoints,
    });
  });
  return usage.length > 0 ? usage.sort((a, b) => a.week - b.week) : undefined;
}

function draftFromRecord(record: Record<string, unknown>, label: string, warnings: string[]): PlayerDraft | null {
  const name = pickString(record, ["name", "fullName", "full_name", "playerName", "player_name", "player"]);
  if (!name) return null;

  const draft: PlayerDraft = { name, sourceLabel: label };
  const positionRaw = pickString(record, ["position", "pos", "defaultPosition", "eligiblePosition"]);
  draft.position = resolvePositionToken(positionRaw);
  if (positionRaw && !draft.position) warnings.push(`${label}: unrecognised position "${positionRaw}" for ${name}.`);

  const teamRaw = pickString(record, ["team", "nflTeam", "nfl_team", "proTeam", "pro_team", "tm"]);
  draft.team = resolveTeamToken(teamRaw);
  if (teamRaw && !draft.team) warnings.push(`${label}: unrecognised team "${teamRaw}" for ${name}.`);

  const injury = record.injury;
  if (isRecord(injury)) {
    draft.injuryStatus = resolveStatusToken(pickString(injury, ["status"]), true);
    draft.injuryDetail = pickString(injury, ["detail", "note", "description"]);
    draft.weeksOut = pickNumber(injury, ["weeksOut", "weeks_out"]);
  } else if (typeof injury === "string") {
    draft.injuryStatus = resolveStatusToken(injury, true);
  }
  if (!draft.injuryStatus) {
    draft.injuryStatus = resolveStatusToken(pickString(record, ["status", "injuryStatus", "injury_status", "health"]), true);
  }
  if (draft.injuryDetail === undefined) draft.injuryDetail = pickString(record, ["injuryDetail", "injury_detail", "injuryNote"]);
  if (draft.weeksOut === undefined) draft.weeksOut = pickNumber(record, ["weeksOut", "weeks_out"]);

  draft.slot = resolveSlotToken(pickString(record, ["slot", "rosterSlot", "roster_slot", "lineupSlot"]));
  draft.rosteredPct = pickNumber(record, ["rosteredPct", "rostered_pct", "rostered", "percentRostered", "ownership", "owned"]);
  draft.usage = usageFromUnknown(record.usage, `${label} (${name})`, warnings);
  draft.seasonTouchdowns = pickNumber(record, ["seasonTouchdowns", "season_touchdowns", "touchdowns"]);
  draft.seasonOpportunities = pickNumber(record, ["seasonOpportunities", "season_opportunities", "opportunities"]);
  draft.handcuffFor = pickString(record, ["handcuffFor", "handcuff_for"]);
  return draft;
}

/**
 * Builds players from any JSON-like value: an array of players, an object with
 * a `players` / `roster` / `entries` array, or an exported FantasyShield roster.
 */
export function playersFromUnknown(value: unknown): ParseResult {
  const context = newContext();
  const extras: Partial<ParseResult> = { source: "upload" };

  let items: unknown[] | null = null;
  if (Array.isArray(value)) {
    items = value;
  } else if (isRecord(value)) {
    const nested = value.players ?? value.roster ?? value.entries ?? (isRecord(value.team) ? value.team.roster : undefined);
    if (Array.isArray(nested)) items = nested;
    extras.leagueName = pickString(value, ["leagueName", "league_name", "league"]);
    extras.teamName = pickString(value, ["teamName", "team_name"]) ?? (typeof value.team === "string" ? value.team : undefined);
    const source = pickString(value, ["source"]);
    if (source === "upload" || source === "paste" || source === "espn" || source === "yahoo" || source === "sample") {
      extras.source = source;
    }
  }

  if (!items) {
    context.errors.push("Expected an array of players or an object with a \"players\" array.");
    return finalize("json", [], context, extras);
  }

  const drafts: PlayerDraft[] = [];
  items.forEach((item, index) => {
    const label = `entry ${index + 1}`;
    if (typeof item === "string") {
      const parsed = parseTextLine(item, index + 1);
      if (parsed && "draft" in parsed) drafts.push({ ...parsed.draft, sourceLabel: label });
      else if (parsed && "error" in parsed) context.errors.push(parsed.error);
      return;
    }
    if (!isRecord(item)) {
      context.errors.push(`${label}: expected an object or a string.`);
      return;
    }
    const draft = draftFromRecord(item, label, context.warnings);
    if (!draft) {
      context.errors.push(`${label}: missing a "name" field.`);
      return;
    }
    drafts.push(draft);
  });

  return finalize("json", drafts, context, extras);
}

export function parseRosterJson(text: string): ParseResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid JSON";
    return { format: "json", players: [], warnings: [], errors: [`Could not parse JSON: ${message}`], source: "upload" };
  }
  return playersFromUnknown(value);
}

/* -------------------------------- Dispatch -------------------------------- */

export function detectFormat(text: string, fileName?: string): RosterInputFormat {
  const extension = fileName?.toLowerCase().split(".").pop();
  if (extension === "json") return "json";
  if (extension === "csv" || extension === "tsv") return "csv";

  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";

  const firstLine = trimmed.split(/\r?\n/)[0] ?? "";
  const delimiter = detectDelimiter(firstLine);
  const headerCells = splitDelimited(firstLine, delimiter).map((cell) => cell.toLowerCase().replace(/[_-]+/g, " ").trim());
  if (headerCells.length >= 2 && headerCells.some((cell) => COLUMN_ALIASES.name.includes(cell))) return "csv";
  return "text";
}

export function parseRosterInput(text: string, format: RosterInputFormat): ParseResult {
  switch (format) {
    case "json":
      return parseRosterJson(text);
    case "csv":
      return parseRosterCsv(text);
    case "text":
      return parseRosterText(text);
  }
}

export const SAMPLE_PASTE = `QB: Marcus Delacroix, DET
RB: Dante Okafor, SF
RB: Kellan Pryce, TEN
WR: Elias Thornbury, CIN
WR: Cyrus Vandenberg, MIA
WR: Theo Amundsen, BAL
TE: Soren Lindqvist, KC
FLEX: Brennan Holloway, WR, GB
K: Nikolai Brandt, NYJ
DST: Browns D/ST
Bench: Tobias Wren, QB, NYG
Bench: Rashad Bellamy, RB, BUF (Q)
Bench: Jalen Mbeki, RB, HOU
Bench: Isaiah Fontaine, WR, LAC
Bench: Owen Castellano, RB, LAR
IR: Gideon Marsh, TE, PIT (IR)`;

export function isPositionValue(value: string): value is Position {
  return isPosition(value);
}
