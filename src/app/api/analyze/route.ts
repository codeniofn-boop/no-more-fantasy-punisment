import { NextResponse } from "next/server";

import { analyzeRoster, type Roster, type RosterSource } from "@/utils/fantasyEngine";
import { playersFromUnknown } from "@/utils/rosterParsers";

const SOURCES: readonly RosterSource[] = ["upload", "paste", "espn", "yahoo", "sample"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(record: Record<string, unknown>, key: string, fallback: string): string {
  const value = record[key];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

/**
 * POST /api/analyze
 * Body: { roster: Roster } or a bare roster / player array.
 * Returns the normalised roster and the engine's analysis.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const rosterInput = isRecord(body) && "roster" in body ? body.roster : body;
  const parsed = playersFromUnknown(rosterInput);
  if (parsed.players.length === 0) {
    return NextResponse.json(
      { error: "No valid players were found in the roster.", details: parsed.errors },
      { status: 400 },
    );
  }

  const record = isRecord(rosterInput) ? rosterInput : {};
  const sourceValue = stringField(record, "source", "upload");
  const source: RosterSource = (SOURCES as readonly string[]).includes(sourceValue) ? (sourceValue as RosterSource) : "upload";
  const importedAtValue = stringField(record, "importedAt", "");
  const importedAt = Number.isNaN(Date.parse(importedAtValue)) ? new Date().toISOString() : importedAtValue;

  const roster: Roster = {
    leagueName: stringField(record, "leagueName", parsed.leagueName ?? "Imported league"),
    teamName: stringField(record, "teamName", parsed.teamName ?? "My team"),
    source,
    players: parsed.players,
    importedAt,
  };

  const analysis = analyzeRoster(roster, { now: new Date() });
  return NextResponse.json({ roster, analysis, warnings: [...parsed.warnings, ...parsed.errors] });
}
