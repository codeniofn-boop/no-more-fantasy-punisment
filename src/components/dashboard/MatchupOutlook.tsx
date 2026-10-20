"use client";

import { CalendarDays } from "lucide-react";

import { PositionBadge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { getDefenseRank, getMatchup } from "@/data/teams";
import { matchupTone } from "@/lib/actionMeta";
import { ENGINE_CONFIG, type Player, type PlayerScore, type Roster, type RosterAnalysis } from "@/utils/fantasyEngine";

interface MatchupOutlookProps {
  roster: Roster;
  analysis: RosterAnalysis;
}

const WEEKS_SHOWN = 5;

export function MatchupOutlook({ roster, analysis }: MatchupOutlookProps) {
  const weeks: number[] = [];
  for (let week = analysis.currentWeek; week < analysis.currentWeek + WEEKS_SHOWN && week <= ENGINE_CONFIG.seasonWeeks; week++) {
    weeks.push(week);
  }

  const scoreById = new Map(analysis.scores.map((score) => [score.playerId, score]));
  const starterIds = new Set(analysis.lineup.starters.map((starter) => starter.playerId));
  const rows = roster.players
    .map((player) => ({ player, score: scoreById.get(player.id) }))
    .filter((entry): entry is { player: Player; score: PlayerScore } => entry.score !== undefined)
    .sort((a, b) => {
      const aStarter = starterIds.has(a.player.id) ? 0 : 1;
      const bStarter = starterIds.has(b.player.id) ? 0 : 1;
      if (aStarter !== bStarter) return aStarter - bStarter;
      return b.score.scheduleScore - a.score.scheduleScore;
    });

  return (
    <Panel
      title="Matchup Outlook"
      subtitle={`Opponent defensive rank versus each player's position for the next ${weeks.length} weeks (1 = toughest, 32 = softest).`}
      icon={CalendarDays}
      bodyClassName="px-0 py-0"
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-ink-600/70 px-5 py-3 text-[11px] text-ink-300">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-drop-500" /> Top-8 defense
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-ink-400" /> Middle of the pack
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-pickup-500" /> Bottom-9 defense
        </span>
        <span className="ml-auto">Starters listed first.</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-xs">
          <thead className="bg-ink-900/70 text-[11px] uppercase tracking-wider text-ink-300">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Player</th>
              {weeks.map((week) => (
                <th key={week} className="px-3 py-2.5 text-center font-semibold">
                  Wk {week}
                </th>
              ))}
              <th className="px-4 py-2.5 font-semibold">Remaining SoS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ player, score }) => (
              <tr key={player.id} className={`border-t border-ink-600/60 ${starterIds.has(player.id) ? "bg-ink-800/40" : ""}`}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <PositionBadge position={player.position} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-100">{player.name}</p>
                      <p className="font-mono text-[11px] text-ink-300">{player.team}</p>
                    </div>
                  </div>
                </td>
                {weeks.map((week) => {
                  const opponent = getMatchup(player.team, week);
                  if (!opponent) {
                    return (
                      <td key={week} className="px-3 py-2.5 text-center">
                        <span className="inline-flex min-w-16 items-center justify-center rounded-md border border-dashed border-ink-500 px-2 py-1 font-mono text-[11px] text-ink-400">BYE</span>
                      </td>
                    );
                  }
                  const rank = getDefenseRank(opponent, player.position);
                  return (
                    <td key={week} className="px-3 py-2.5 text-center">
                      <span className={`inline-flex min-w-16 items-center justify-center gap-1 rounded-md px-2 py-1 font-mono text-[11px] ring-1 ring-inset ${matchupTone(rank)}`}>
                        {opponent}
                        <span className="opacity-70">#{rank}</span>
                      </span>
                    </td>
                  );
                })}
                <td className="px-4 py-2.5">
                  <ScoreBar value={score.scheduleScore} size="sm" className="w-32" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
