import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { MAX_BODY_BYTES, POST } from "@/app/api/analyze/route";
import { GET } from "@/app/api/league/[provider]/[leagueId]/route";
import { buildLeagueRoster } from "@/utils/leagueImport";
import { MAX_PLAYERS } from "@/utils/rosterParsers";

const SNAPSHOT_AT = "2026-10-19T12:00:00.000Z";

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function league(provider: string, leagueId: string) {
  return GET(new Request(`http://localhost/api/league/${provider}/${leagueId}`), { params: Promise.resolve({ provider, leagueId }) });
}

describe("POST /api/analyze", () => {
  test("analyzes a league roster and echoes the normalised roster", async () => {
    const roster = buildLeagueRoster("espn", "184522", SNAPSHOT_AT);
    const response = await POST(post({ roster }));
    assert.equal(response.status, 200);
    const body = (await response.json()) as { roster: { source: string; teamName: string; players: unknown[] }; analysis: { health: { overall: number }; actions: unknown[]; lineup: { starters: unknown[] } }; warnings: string[] };
    assert.equal(body.roster.source, "espn");
    assert.equal(body.roster.teamName, roster.teamName);
    assert.equal(body.roster.players.length, 16);
    assert.ok(body.analysis.health.overall > 0);
    assert.equal(body.analysis.lineup.starters.length, 10);
    assert.ok(body.analysis.actions.length > 0);
    assert.deepEqual(body.warnings, []);
  });

  test("accepts a bare array of players and reports warnings", async () => {
    const response = await POST(post(["Dante Okafor, RB, SF", { name: "Fresh Face", position: "WR", team: "Bills", status: "Q" }, { name: "Nobody Known" }]));
    assert.equal(response.status, 200);
    const body = (await response.json()) as { roster: { players: Array<{ name: string; team: string }> }; warnings: string[] };
    assert.equal(body.roster.players.length, 2);
    assert.equal(body.roster.players[1].team, "BUF");
    assert.ok(body.warnings.some((warning) => warning.includes("Nobody Known")));
  });

  test("rejects invalid JSON, empty rosters, oversized rosters and oversized bodies", async () => {
    assert.equal((await POST(post("{not json"))).status, 400);
    assert.equal((await POST(post({ roster: { players: [] } }))).status, 400);
    const tooMany = Array.from({ length: MAX_PLAYERS + 1 }, (_, index) => ({ name: `Player ${index}`, position: "WR", team: "SF" }));
    const overLimit = await POST(post(tooMany));
    assert.equal(overLimit.status, 400);
    const overLimitBody = (await overLimit.json()) as { details: string[] };
    assert.ok(overLimitBody.details[0]?.includes("limit"));
    const huge = await POST(post({ roster: { players: [] } }, { "content-length": String(MAX_BODY_BYTES + 1) }));
    assert.equal(huge.status, 413);
  });
});

describe("GET /api/league/[provider]/[leagueId]", () => {
  test("returns a deterministic roster for a valid provider and id", async () => {
    const first = await league("ESPN", "184522");
    assert.equal(first.status, 200);
    const body = (await first.json()) as { roster: { source: string; players: unknown[]; teamName: string } };
    assert.equal(body.roster.source, "espn");
    assert.equal(body.roster.players.length, 16);
    const second = (await (await league("espn", "184522")).json()) as { roster: { teamName: string } };
    assert.equal(second.roster.teamName, body.roster.teamName);
  });

  test("rejects unknown providers and malformed ids", async () => {
    const provider = await league("sleeper", "184522");
    assert.equal(provider.status, 400);
    assert.ok(((await provider.json()) as { error: string }).error.includes("sleeper"));
    assert.equal((await league("espn", "x")).status, 400);
    assert.equal((await league("espn", "bad id")).status, 400);
  });
});
