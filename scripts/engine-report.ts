/**
 * Prints the engine's verdict on the sample roster and validates the generated
 * schedule. Run with `npm run engine:report`.
 */

import { analyzeRoster, ENGINE_CONFIG, type ActionType } from "@/utils/fantasyEngine";
import { buildSampleRoster } from "@/data/players";
import { getByeWeek, getMatchup, NFL_TEAMS, SEASON_WEEKS } from "@/data/teams";

function validateSchedule(): void {
  const problems: string[] = [];
  for (const team of NFL_TEAMS) {
    const seen = new Set<string>();
    let byes = 0;
    for (let week = 1; week <= SEASON_WEEKS; week++) {
      const opponent = getMatchup(team, week);
      if (opponent === null) {
        byes += 1;
        if (getByeWeek(team) !== week) problems.push(`${team} idle in week ${week} outside its bye`);
        continue;
      }
      if (opponent === team) problems.push(`${team} plays itself in week ${week}`);
      if (getMatchup(opponent, week) !== team) problems.push(`${team} vs ${opponent} not symmetric in week ${week}`);
      if (seen.has(opponent)) problems.push(`${team} plays ${opponent} twice`);
      seen.add(opponent);
    }
    if (byes !== 1) problems.push(`${team} has ${byes} byes`);
  }
  if (problems.length > 0) {
    console.error("Schedule problems:\n" + problems.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`Schedule OK: ${NFL_TEAMS.length} teams, ${SEASON_WEEKS} weeks, one bye each.`);
  }
}

function printReport(): void {
  const roster = buildSampleRoster(new Date().toISOString());
  const analysis = analyzeRoster(roster, { now: new Date() });

  console.log(`\nWeek ${analysis.currentWeek} (${analysis.weeksRemaining} remaining)`);
  console.log(`Team Health Index: ${analysis.health.overall} (${analysis.health.grade})`);
  console.log(`  volume ${analysis.health.volume} | schedule ${analysis.health.schedule} | injury ${analysis.health.injury} | depth ${analysis.health.depth}`);
  console.log(`  ${analysis.health.summary}`);

  console.log("\nPlayer scores:");
  for (const score of [...analysis.scores].sort((a, b) => b.composite - a.composite)) {
    const player = roster.players.find((candidate) => candidate.id === score.playerId);
    if (!player) continue;
    const starter = analysis.lineup.starters.some((slot) => slot.playerId === player.id) ? "*" : " ";
    console.log(
      `  ${starter} ${player.name.padEnd(24)} ${player.position.padEnd(3)} ${player.team.padEnd(3)} comp ${String(score.composite).padStart(5)} vol ${String(score.volumeScore).padStart(5)} sos ${String(score.scheduleScore).padStart(5)} n3 ${String(score.nextThreeScheduleScore).padStart(5)} inj ${String(score.injuryRisk).padStart(5)} td ${String(score.tdRatio).padStart(5)} ${score.trend}`,
    );
  }

  console.log("\nLineup swaps:");
  for (const swap of analysis.lineup.swaps) {
    console.log(`  ${swap.slot}: start ${swap.benchPlayerId} over ${swap.starterPlayerId} (+${swap.pointSwing})`);
  }
  if (analysis.lineup.swaps.length === 0) console.log("  none");

  const labels: Record<ActionType, string> = {
    SELL_HIGH: "WHO TO TRADE (SELL HIGH)",
    BUY_LOW: "WHO TO TRADE FOR (BUY LOW)",
    DROP: "WHO TO DROP",
    PICK_UP: "WHO TO PICK UP",
  };
  for (const type of Object.keys(labels) as ActionType[]) {
    console.log(`\n${labels[type]}`);
    const items = analysis.actions.filter((item) => item.type === type);
    if (items.length === 0) console.log("  (none)");
    for (const item of items) {
      console.log(`  [${item.confidence}] P${item.priority} ${item.player.name} (${item.player.position}, ${item.player.team}) swing ${item.projectedWeeklySwing} tags: ${item.tags.join(", ")}`);
      console.log(`      ${item.headline}`);
      for (const reason of item.reasons) console.log(`      - ${reason}`);
      if (item.counterpart) console.log(`      ${item.counterpart.label}: ${item.counterpart.name}`);
    }
  }

  console.log(`\nEngine config: week ${ENGINE_CONFIG.currentWeek}, weights ${JSON.stringify(ENGINE_CONFIG.compositeWeights)}`);
}

validateSchedule();
printReport();
