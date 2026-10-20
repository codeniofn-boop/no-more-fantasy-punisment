import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { BYE_WEEK_END, BYE_WEEK_START, getByeWeek, getDefenseRank, getMatchup, NFL_TEAMS, SEASON_WEEKS } from "@/data/teams";
import { POSITIONS } from "@/utils/fantasyEngine";

describe("generated schedule", () => {
  test("every team plays 17 games with exactly one bye inside the bye window", () => {
    for (const team of NFL_TEAMS) {
      let games = 0;
      const byes: number[] = [];
      for (let week = 1; week <= SEASON_WEEKS; week++) {
        if (getMatchup(team, week) === null) byes.push(week);
        else games += 1;
      }
      assert.equal(games, SEASON_WEEKS - 1, `${team} should play ${SEASON_WEEKS - 1} games`);
      assert.deepEqual(byes, [getByeWeek(team)], `${team} should sit out exactly in its bye week`);
      assert.ok(getByeWeek(team) >= BYE_WEEK_START && getByeWeek(team) <= BYE_WEEK_END, `${team} bye outside window`);
    }
  });

  test("each bye week rests exactly four teams", () => {
    for (let week = BYE_WEEK_START; week <= BYE_WEEK_END; week++) {
      const resting = NFL_TEAMS.filter((team) => getByeWeek(team) === week);
      assert.equal(resting.length, 4, `week ${week} rests ${resting.length} teams`);
    }
  });

  test("pairings are symmetric and no two teams meet twice", () => {
    for (const team of NFL_TEAMS) {
      const opponents = new Set<string>();
      for (let week = 1; week <= SEASON_WEEKS; week++) {
        const opponent = getMatchup(team, week);
        if (opponent === null) continue;
        assert.notEqual(opponent, team, `${team} is scheduled against itself in week ${week}`);
        assert.equal(getMatchup(opponent, week), team, `${team} vs ${opponent} is not symmetric in week ${week}`);
        assert.ok(!opponents.has(opponent), `${team} meets ${opponent} twice`);
        opponents.add(opponent);
      }
    }
  });

  test("matchups outside the season are null", () => {
    assert.equal(getMatchup("SF", 0), null);
    assert.equal(getMatchup("SF", SEASON_WEEKS + 1), null);
  });

  test("defensive ranks form a permutation of 1 to 32 for every position", () => {
    for (const position of POSITIONS) {
      const ranks = NFL_TEAMS.map((team) => getDefenseRank(team, position)).sort((a, b) => a - b);
      assert.deepEqual(
        ranks,
        Array.from({ length: NFL_TEAMS.length }, (_, index) => index + 1),
        `${position} ranks are not a permutation`,
      );
    }
  });
});
