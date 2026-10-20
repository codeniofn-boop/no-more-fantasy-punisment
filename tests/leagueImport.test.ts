import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildLeagueRoster, isLeagueProvider, LEAGUE_ID_PATTERN } from "@/utils/leagueImport";

const SNAPSHOT_AT = "2026-10-19T12:00:00.000Z";

describe("league import", () => {
  test("the same id always produces the same roster", () => {
    assert.deepEqual(buildLeagueRoster("espn", "184522", SNAPSHOT_AT), buildLeagueRoster("espn", "184522", SNAPSHOT_AT));
  });

  test("ids are matched case-insensitively while the typed id is kept for display", () => {
    const upper = buildLeagueRoster("yahoo", "ABC-123", SNAPSHOT_AT);
    const lower = buildLeagueRoster("yahoo", "abc-123", SNAPSHOT_AT);
    assert.deepEqual(upper.players, lower.players);
    assert.equal(upper.teamName, lower.teamName);
    assert.ok(upper.leagueName.includes("ABC-123"));
    assert.ok(lower.leagueName.includes("abc-123"));
  });

  test("different providers or ids produce different teams", () => {
    const ids = (provider: "espn" | "yahoo", id: string) => buildLeagueRoster(provider, id, SNAPSHOT_AT).players.map((player) => player.id).sort();
    assert.notDeepEqual(ids("espn", "184522"), ids("yahoo", "184522"));
    assert.notDeepEqual(ids("espn", "184522"), ids("espn", "7"));
  });

  test("every roster has a legal shape and a full set of starters", () => {
    for (const id of ["184522", "7", "yahoo-99", "abc-123", "team.one"]) {
      for (const provider of ["espn", "yahoo"] as const) {
        const roster = buildLeagueRoster(provider, id, SNAPSHOT_AT);
        assert.equal(roster.source, provider);
        assert.equal(roster.players.length, 16);
        const count = (position: string) => roster.players.filter((player) => player.position === position).length;
        assert.deepEqual([count("QB"), count("RB"), count("WR"), count("TE"), count("K"), count("DST")], [2, 5, 5, 2, 1, 1]);
        const starters = roster.players.filter((player) => player.slot === "Starter");
        assert.equal(starters.length, 10, `${provider}/${id} has ${starters.length} starters`);
        for (const position of ["QB", "TE", "K", "DST"]) {
          assert.equal(starters.filter((player) => player.position === position).length, 1, `${provider}/${id} ${position} starters`);
        }
        assert.ok(roster.players.every((player) => player.injury.status !== "IR" || player.slot === "IR"));
        assert.ok(starters.every((player) => player.injury.status !== "IR"));
        assert.ok(roster.leagueName.includes(id));
      }
    }
  });

  test("provider and id validation", () => {
    assert.ok(isLeagueProvider("espn"));
    assert.ok(!isLeagueProvider("sleeper"));
    assert.ok(LEAGUE_ID_PATTERN.test("184522"));
    assert.ok(LEAGUE_ID_PATTERN.test("abc-123.x"));
    assert.ok(!LEAGUE_ID_PATTERN.test("x"));
    assert.ok(!LEAGUE_ID_PATTERN.test("-leading"));
    assert.ok(!LEAGUE_ID_PATTERN.test("a".repeat(25)));
  });
});
