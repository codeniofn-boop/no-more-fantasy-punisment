import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { buildSampleRoster, PLAYER_UNIVERSE } from "@/data/players";
import { getByeWeek } from "@/data/teams";
import {
  ACTION_TYPES,
  analyzeRoster,
  buildLineup,
  ENGINE_CONFIG,
  gradeFor,
  scorePlayer,
  synthesizePlayer,
  type ActionItem,
  type ActionType,
  type LineupSlot,
  type Player,
  type Position,
} from "@/utils/fantasyEngine";

const SNAPSHOT_AT = "2026-10-19T12:00:00.000Z";

function sampleAnalysis() {
  const roster = buildSampleRoster(SNAPSHOT_AT);
  return { roster, analysis: analyzeRoster(roster, { now: new Date(SNAPSHOT_AT) }) };
}

function within(value: number, min: number, max: number, label: string): void {
  assert.ok(value >= min && value <= max, `${label} = ${value} is outside ${min}..${max}`);
}

const SLOT_ELIGIBILITY: Record<LineupSlot, Position[]> = {
  QB: ["QB"],
  RB: ["RB"],
  WR: ["WR"],
  TE: ["TE"],
  FLEX: ["RB", "WR", "TE"],
  K: ["K"],
  DST: ["DST"],
};

describe("player scoring", () => {
  test("every score is bounded and deterministic", () => {
    for (const player of PLAYER_UNIVERSE) {
      const score = scorePlayer(player);
      within(score.volumeScore, 0, 100, `${player.name} volume`);
      within(score.scheduleScore, 0, 100, `${player.name} schedule`);
      within(score.nextThreeScheduleScore, 0, 100, `${player.name} next three`);
      within(score.injuryRisk, 0, 100, `${player.name} risk`);
      within(score.composite, 0, 100, `${player.name} composite`);
      assert.ok(score.projectedPoints >= 0, `${player.name} projection is negative`);
      assert.deepEqual(scorePlayer(player), score, `${player.name} scoring is not deterministic`);
    }
  });

  test("players on a bye or out project zero points", () => {
    const roster = buildSampleRoster(SNAPSHOT_AT);
    const onBye = roster.players.find((player) => player.byeWeek === ENGINE_CONFIG.currentWeek);
    const onIr = roster.players.find((player) => player.injury.status === "IR");
    assert.ok(onBye, "sample roster should include a bye-week player");
    assert.ok(onIr, "sample roster should include an IR player");
    assert.equal(scorePlayer(onBye).projectedPoints, 0);
    assert.equal(scorePlayer(onIr).projectedPoints, 0);
  });

  test("touchdown ratio flags inflated and unlucky scorers", () => {
    const roster = buildSampleRoster(SNAPSHOT_AT);
    const vandenberg = roster.players.find((player) => player.name === "Cyrus Vandenberg");
    const amundsen = roster.players.find((player) => player.name === "Theo Amundsen");
    assert.ok(vandenberg && amundsen);
    assert.ok(scorePlayer(vandenberg).tdRatio >= ENGINE_CONFIG.thresholds.sellHighTdRatio);
    assert.ok(scorePlayer(amundsen).tdRatio <= ENGINE_CONFIG.thresholds.buyLowTdRatio);
  });
});

describe("lineup", () => {
  test("the optimal lineup is legal and covers every slot", () => {
    const { roster, analysis } = sampleAnalysis();
    const byId = new Map(roster.players.map((player) => [player.id, player]));
    assert.equal(analysis.lineup.starters.length, ENGINE_CONFIG.lineupSlots.length);
    assert.deepEqual(
      analysis.lineup.starters.map((starter) => starter.slot),
      [...ENGINE_CONFIG.lineupSlots],
    );
    const ids = new Set<string>();
    for (const starter of analysis.lineup.starters) {
      const player = byId.get(starter.playerId);
      assert.ok(player, `starter ${starter.playerId} is not on the roster`);
      assert.ok(!ids.has(player.id), `${player.name} starts twice`);
      ids.add(player.id);
      assert.ok(SLOT_ELIGIBILITY[starter.slot].includes(player.position), `${player.name} cannot fill ${starter.slot}`);
      assert.ok(player.injury.status !== "IR" && player.injury.status !== "Out", `${player.name} is unavailable`);
    }
    assert.equal(analysis.lineup.bench.length + ids.size, roster.players.length);
    assert.ok(analysis.lineup.bench.every((id) => !ids.has(id)));
  });

  test("swaps only recommend upgrades over flagged starters", () => {
    const roster = buildSampleRoster(SNAPSHOT_AT);
    const players: Player[] = roster.players.map((player) => ({ ...player, slot: "Bench" }));
    const weakBack = players.find((player) => player.name === "Owen Castellano");
    assert.ok(weakBack);
    weakBack.slot = "Starter";
    const scores = players.map((player) => scorePlayer(player));
    const lineup = buildLineup(players, scores);
    assert.ok(lineup.swaps.length >= 1, "expected at least one swap");
    for (const swap of lineup.swaps) {
      assert.ok(swap.pointSwing > 0, "swap should add points");
      assert.equal(swap.starterPlayerId, weakBack.id);
    }
  });
});

describe("health index and action lanes", () => {
  test("health index is bounded and graded consistently", () => {
    const { analysis } = sampleAnalysis();
    const health = analysis.health;
    for (const key of ["overall", "volume", "schedule", "injury", "depth"] as const) within(health[key], 0, 100, key);
    assert.equal(health.grade, gradeFor(health.overall));
    assert.ok(health.summary.length > 0);
  });

  test("lanes are capped, sorted, well-formed and drawn from the right side of the roster", () => {
    const { roster, analysis } = sampleAnalysis();
    const rosterIds = new Set(roster.players.map((player) => player.id));
    for (const type of ACTION_TYPES) {
      const items = analysis.actions.filter((item) => item.type === type);
      assert.ok(items.length <= ENGINE_CONFIG.perColumnLimit, `${type} exceeds the per-lane limit`);
      for (let index = 0; index < items.length; index++) {
        const item = items[index];
        within(item.confidence, 0, 100, `${item.player.name} confidence`);
        if (index > 0) assert.ok(items[index - 1].confidence >= item.confidence, `${type} is not sorted`);
        assert.ok(item.reasons.length > 0, `${item.player.name} has no reasons`);
        assert.ok(item.headline.length > 0);
        const expectedPriority = item.confidence >= 75 ? 1 : item.confidence >= 55 ? 2 : 3;
        assert.equal(item.priority, expectedPriority, `${item.player.name} priority`);
        const onRoster = rosterIds.has(item.player.id);
        if (type === "SELL_HIGH" || type === "DROP") assert.ok(onRoster, `${item.player.name} should be on the roster`);
        else assert.ok(!onRoster, `${item.player.name} should not be on the roster`);
        if (type === "PICK_UP") assert.ok(item.player.rosteredPct < ENGINE_CONFIG.thresholds.pickupMaxRostered);
        if (type === "BUY_LOW") assert.ok(item.player.rosteredPct >= ENGINE_CONFIG.thresholds.buyLowMinRostered);
      }
    }
  });

  test("counterparts cross-reference the opposite lane", () => {
    const { analysis } = sampleAnalysis();
    const names = (type: ActionType): Set<string> => new Set(analysis.actions.filter((item) => item.type === type).map((item) => item.player.name));
    const expectCounterpart = (item: ActionItem, lane: ActionType): void => {
      if (!item.counterpart) return;
      assert.ok(names(lane).has(item.counterpart.name), `${item.player.name} points at ${item.counterpart.name}, which is not in ${lane}`);
    };
    for (const item of analysis.actions) {
      if (item.type === "BUY_LOW") expectCounterpart(item, "SELL_HIGH");
      if (item.type === "SELL_HIGH") expectCounterpart(item, "BUY_LOW");
      if (item.type === "PICK_UP") expectCounterpart(item, "DROP");
      if (item.type === "DROP") expectCounterpart(item, "PICK_UP");
    }
  });

  test("the sample roster produces the expected headline moves", () => {
    const { analysis } = sampleAnalysis();
    const top = (type: ActionType): ActionItem | undefined => analysis.actions.find((item) => item.type === type);
    assert.equal(top("PICK_UP")?.player.name, "Ezekiel Haddad");
    assert.ok(top("PICK_UP")?.tags.includes("Trending Handcuff"));
    assert.equal(top("DROP")?.player.name, "Gideon Marsh");
    assert.ok(top("DROP")?.tags.includes("Long-term Injury"));
    assert.equal(top("SELL_HIGH")?.player.name, "Cyrus Vandenberg");
    assert.ok(top("SELL_HIGH")?.tags.includes("TD Regression"));
    assert.equal(top("BUY_LOW")?.player.name, "Mateo Villanueva");
  });

  test("analysis is deterministic for a fixed timestamp", () => {
    const first = sampleAnalysis().analysis;
    const second = sampleAnalysis().analysis;
    assert.deepEqual(first, second);
  });
});

describe("synthesizePlayer", () => {
  test("fills baseline usage, derives the bye week and builds a stable id", () => {
    const player = synthesizePlayer({ name: "Test Receiver", position: "WR", team: "SF" });
    assert.equal(player.id, "test-receiver-wr-sf");
    assert.equal(player.usage.length, ENGINE_CONFIG.recencyWeights.length);
    assert.equal(player.byeWeek, getByeWeek("SF"));
    assert.ok(player.seasonOpportunities > 0);
    assert.equal(player.injury.status, "Healthy");
    assert.equal(player.slot, "Bench");
    assert.deepEqual(synthesizePlayer({ name: "Test Receiver", position: "WR", team: "SF" }), player);
  });

  test("keeps supplied usage and stats instead of the baseline", () => {
    const usage = [
      { week: 5, snapShare: 0.9, targets: 10, carries: 0, passAttempts: 0, touchdowns: 1, fantasyPoints: 20 },
      { week: 6, snapShare: 0.95, targets: 12, carries: 1, passAttempts: 0, touchdowns: 2, fantasyPoints: 28 },
    ];
    const player = synthesizePlayer({ name: "Usage Keeper", position: "WR", team: "KC", usage, seasonTouchdowns: 5, seasonOpportunities: 60 });
    assert.deepEqual(player.usage, usage);
    assert.equal(player.seasonTouchdowns, 5);
    assert.equal(player.seasonOpportunities, 60);
  });
});
