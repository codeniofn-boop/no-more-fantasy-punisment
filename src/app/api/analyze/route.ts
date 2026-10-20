import { NextResponse } from "next/server";

import { analyzeRoster, type Roster, type RosterSource } from "@/utils/fantasyEngine";
import { playersFromUnknown } from "@/utils/rosterParsers";

const SOURCES: readonly RosterSource[] = ["upload", "paste", "espn", "yahoo", "sample"];

/** Largest request body accepted, in bytes. A 200-player roster with full usage is well under 1 MB. */
export const MAX_BODY_BYTES = 2 * 1024 * 1024;

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
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: `Request body exceeds ${MAX_BODY_BYTES} bytes.` }, { status: 413 });
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: `Request body exceeds ${MAX_BODY_BYTES} bytes.` }, { status: 413 });
    }
    body = JSON.parse(text) as unknown;
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
