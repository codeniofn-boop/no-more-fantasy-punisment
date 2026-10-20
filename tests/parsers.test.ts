import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildSampleRoster, playerIdFor } from "@/data/players";
import {
  detectDelimiter,
  detectFormat,
  MAX_PLAYERS,
  MAX_USAGE_WEEKS,
  parseRosterCsv,
  parseRosterInput,
  parseRosterJson,
  parseRosterText,
  parseTextLine,
  playersFromUnknown,
  SAMPLE_PASTE,
} from "@/utils/rosterParsers";

const SNAPSHOT_AT = "2026-10-19T12:00:00.000Z";

describe("text parsing", () => {
  test("the sample paste resolves every player with slots and statuses", () => {
    const result = parseRosterText(SAMPLE_PASTE);
    assert.deepEqual(result.errors, []);
    assert.equal(result.players.length, 16);
    const byName = new Map(result.players.map((player) => [player.name, player]));
    assert.equal(byName.get("Marcus Delacroix")?.slot, "Starter");
    assert.equal(byName.get("Rashad Bellamy")?.injury.status, "Questionable");
    assert.equal(byName.get("Rashad Bellamy")?.slot, "Bench");
    assert.equal(byName.get("Gideon Marsh")?.slot, "IR");
    assert.equal(byName.get("Gideon Marsh")?.injury.status, "IR");
    const defense = byName.get("Cleveland Browns D/ST");
    assert.equal(defense?.position, "DST");
    assert.equal(defense?.team, "CLE");
  });

  test("many line shapes resolve to the same known player", () => {
    const expected = playerIdFor("Dante Okafor", "RB", "SF");
    const shapes = ["Dante Okafor, RB, SF", "RB Dante Okafor SF", "Dante Okafor (SF - RB)", "3. Dante Okafor", "- Dante Okafor", "dante okafor | rb | 49ers"];
    for (const shape of shapes) {
      const result = parseRosterText(shape);
      assert.deepEqual(result.errors, [], `errors for "${shape}"`);
      assert.equal(result.players[0]?.id, expected, `"${shape}" did not resolve`);
    }
  });

  test("unknown players are synthesized when a position is present and rejected when it is not", () => {
    const known = parseRosterText("WR Unknown Rookie BUF");
    assert.equal(known.players.length, 1);
    assert.equal(known.players[0].position, "WR");
    assert.equal(known.players[0].team, "BUF");
    assert.ok(known.warnings.some((warning) => warning.includes("baseline")));

    const noTeam = parseRosterText("Unknown Tight End, TE");
    assert.equal(noTeam.players.length, 1);
    assert.ok(noTeam.warnings.some((warning) => warning.includes("league-average schedule")));

    const noPosition = parseRosterText("Nobody Known");
    assert.equal(noPosition.players.length, 0);
    assert.ok(noPosition.errors[0]?.includes("no position"));
  });

  test("injury tags override the known status", () => {
    const result = parseRosterText("Theo Amundsen (Q)");
    assert.equal(result.players[0]?.injury.status, "Questionable");
    assert.equal(parseTextLine("   ", 1), null);
  });

  test("duplicates are reported once and kept once", () => {
    const result = parseRosterText("Dante Okafor\nDante Okafor, RB, SF");
    assert.equal(result.players.length, 1);
    assert.ok(result.warnings.some((warning) => warning.includes("more than once")));
  });
});

describe("csv parsing", () => {
  test("header rows with alternate delimiters and short status codes", () => {
    const csv = ["name;pos;team;status;slot", "Dante Okafor;RB;SF;Healthy;Starter", "Rashad Bellamy;RB;BUF;Q;Bench"].join("\n");
    assert.equal(detectDelimiter(csv.split("\n")[0]), ";");
    const result = parseRosterCsv(csv);
    assert.deepEqual(result.errors, []);
    assert.equal(result.players.length, 2);
    assert.equal(result.players[0].slot, "Starter");
    assert.equal(result.players[1].injury.status, "Questionable");
  });

  test("header-less rows are read positionally with a warning", () => {
    const result = parseRosterCsv("Dante Okafor,RB,SF\nKellan Pryce,RB,TEN");
    assert.equal(result.players.length, 2);
    assert.ok(result.warnings.some((warning) => warning.includes("No header row")));
  });

  test("quoted cells keep their delimiters", () => {
    const result = parseRosterCsv('name,position,team\n"Unknown, Jr.",WR,SF');
    assert.equal(result.players[0]?.name, "Unknown, Jr.");
  });
});

describe("json parsing", () => {
  test("accepts arrays, wrapped objects and strings", () => {
    const fromArray = playersFromUnknown([{ name: "Dante Okafor", position: "RB", team: "SF" }, "Kellan Pryce, RB, TEN"]);
    assert.equal(fromArray.players.length, 2);
    const wrapped = playersFromUnknown({ leagueName: "Test League", teamName: "Testers", players: [{ name: "Soren Lindqvist" }] });
    assert.equal(wrapped.leagueName, "Test League");
    assert.equal(wrapped.teamName, "Testers");
    assert.equal(wrapped.players[0]?.position, "TE");
    const invalid = parseRosterJson("{not json");
    assert.equal(invalid.players.length, 0);
    assert.ok(invalid.errors[0]?.includes("Could not parse JSON"));
    const shapeless = playersFromUnknown({ hello: "world" });
    assert.ok(shapeless.errors[0]?.includes("players"));
  });

  test("an exported roster round-trips through the parser unchanged", () => {
    const roster = buildSampleRoster(SNAPSHOT_AT);
    const result = playersFromUnknown(JSON.parse(JSON.stringify(roster)));
    assert.deepEqual(result.errors, []);
    assert.equal(result.source, "sample");
    assert.equal(result.leagueName, roster.leagueName);
    assert.deepEqual(result.players, roster.players);
  });

  test("usage history is capped to the most recent weeks", () => {
    const usage = Array.from({ length: MAX_USAGE_WEEKS + 4 }, (_, index) => ({ week: index + 1, fantasyPoints: index, targets: 5 }));
    const result = playersFromUnknown([{ name: "Long History", position: "WR", team: "SF", usage }]);
    assert.equal(result.players[0]?.usage.length, MAX_USAGE_WEEKS);
    assert.equal(result.players[0]?.usage.at(-1)?.week, MAX_USAGE_WEEKS + 4);
  });
});

describe("limits and format detection", () => {
  test("oversized inputs are rejected in every format", () => {
    const lines = Array.from({ length: MAX_PLAYERS + 1 }, (_, index) => `WR Player ${index} SF`);
    const text = parseRosterText(lines.join("\n"));
    assert.equal(text.players.length, 0);
    assert.ok(text.errors[0]?.includes("limit"));
    const csv = parseRosterCsv(["name,position,team", ...lines.map((line, index) => `Player ${index},WR,SF`)].join("\n"));
    assert.equal(csv.players.length, 0);
    const json = playersFromUnknown(lines.map((line, index) => ({ name: `Player ${index}`, position: "WR", team: "SF" })));
    assert.equal(json.players.length, 0);
  });

  test("detectFormat uses the file name first, then the content", () => {
    assert.equal(detectFormat("anything", "roster.JSON"), "json");
    assert.equal(detectFormat("anything", "roster.csv"), "csv");
    assert.equal(detectFormat("[{\"name\":\"x\"}]"), "json");
    assert.equal(detectFormat("name,position,team\nDante Okafor,RB,SF"), "csv");
    assert.equal(detectFormat("Dante Okafor, RB, SF"), "text");
    assert.equal(parseRosterInput("Dante Okafor", "text").players.length, 1);
  });
});
