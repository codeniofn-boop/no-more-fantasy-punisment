"use client";

import { ArrowRightLeft, Download, Minus, Trash, TrendingDown, TrendingUp, Users } from "lucide-react";

import { PositionBadge, StatusBadge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { scoreTextTone } from "@/lib/actionMeta";
import type { Player, PlayerScore, Roster, RosterAnalysis } from "@/utils/fantasyEngine";

interface RosterTableProps {
  roster: Roster;
  analysis: RosterAnalysis;
  onExport: () => void;
  onClear: () => void;
}

interface Row {
  player: Player;
  score: PlayerScore;
  slotLabel: string;
  isStarter: boolean;
}

function buildRows(roster: Roster, analysis: RosterAnalysis): Row[] {
  const scoreById = new Map(analysis.scores.map((score) => [score.playerId, score]));
  const starterSlots = new Map(analysis.lineup.starters.map((starter) => [starter.playerId, starter.slot]));
  const rows: Row[] = [];

  for (const starter of analysis.lineup.starters) {
    const player = roster.players.find((candidate) => candidate.id === starter.playerId);
    const score = scoreById.get(starter.playerId);
    if (player && score) rows.push({ player, score, slotLabel: starter.slot, isStarter: true });
  }

  const bench = roster.players
    .filter((player) => !starterSlots.has(player.id))
    .map((player) => ({ player, score: scoreById.get(player.id) }))
    .filter((entry): entry is { player: Player; score: PlayerScore } => entry.score !== undefined)
    .sort((a, b) => {
      const aIr = a.player.injury.status === "IR" ? 1 : 0;
      const bIr = b.player.injury.status === "IR" ? 1 : 0;
      if (aIr !== bIr) return aIr - bIr;
      return b.score.projectedPoints - a.score.projectedPoints;
    });

  for (const entry of bench) {
    rows.push({ ...entry, slotLabel: entry.player.injury.status === "IR" ? "IR" : "BN", isStarter: false });
  }
  return rows;
}

function TrendIcon({ trend }: { trend: PlayerScore["trend"] }) {
  if (trend === "rising") return <TrendingUp className="h-4 w-4 text-shield-400" aria-label="Rising" />;
  if (trend === "falling") return <TrendingDown className="h-4 w-4 text-drop-400" aria-label="Falling" />;
  return <Minus className="h-4 w-4 text-ink-400" aria-label="Stable" />;
}

export function RosterTable({ roster, analysis, onExport, onClear }: RosterTableProps) {
  const rows = buildRows(roster, analysis);
  const playerById = new Map(roster.players.map((player) => [player.id, player]));

  return (
    <div className="space-y-5">
      <Panel
        title={`${roster.teamName} · ${roster.players.length} players`}
        subtitle={`${roster.leagueName}. Starters reflect the engine's optimal lineup for week ${analysis.currentWeek}.`}
        icon={Users}
        action={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-600 px-3 py-1.5 text-xs font-semibold text-ink-200 transition hover:text-ink-100"
            >
              <Download className="h-3.5 w-3.5" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1.5 rounded-lg border border-drop-500/40 px-3 py-1.5 text-xs font-semibold text-drop-300 transition hover:bg-drop-500/10"
            >
              <Trash className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>
        }
        bodyClassName="px-0 py-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-xs">
            <thead className="bg-ink-900/70 text-[11px] uppercase tracking-wider text-ink-300">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Slot</th>
                <th className="px-4 py-2.5 font-semibold">Player</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 font-semibold">Bye</th>
                <th className="px-3 py-2.5 text-right font-semibold">Proj</th>
                <th className="px-3 py-2.5 font-semibold">Volume</th>
                <th className="px-3 py-2.5 font-semibold">Schedule</th>
                <th className="px-3 py-2.5 text-right font-semibold">Risk</th>
                <th className="px-3 py-2.5 text-right font-semibold">TD ratio</th>
                <th className="px-3 py-2.5 text-right font-semibold">Composite</th>
                <th className="px-3 py-2.5 font-semibold">Trend</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const previous = rows[index - 1];
                const divider = previous && previous.isStarter && !row.isStarter;
                return (
                  <tr
                    key={row.player.id}
                    className={`border-t border-ink-600/60 ${divider ? "border-t-2 border-ink-500" : ""} ${row.isStarter ? "bg-ink-800/40" : ""}`}
                  >
                    <td className="px-4 py-2.5">
                      <span className={`font-mono text-[11px] font-semibold ${row.isStarter ? "text-shield-300" : "text-ink-300"}`}>{row.slotLabel}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <PositionBadge position={row.player.position} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink-100">{row.player.name}</p>
                          <p className="font-mono text-[11px] text-ink-300">
                            {row.player.team} · {row.score.nextOpponent ? `wk ${analysis.currentWeek} vs ${row.score.nextOpponent.team} (#${row.score.nextOpponent.rank})` : "BYE"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={row.player.injury.status} detail={row.player.injury.detail || undefined} />
                    </td>
                    <td className="px-3 py-2.5 font-mono text-ink-200">{row.player.byeWeek}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-ink-100">{row.score.projectedPoints.toFixed(1)}</td>
                    <td className="px-3 py-2.5">
                      <ScoreBar value={row.score.volumeScore} size="sm" className="w-24" />
                    </td>
                    <td className="px-3 py-2.5">
                      <ScoreBar value={row.score.scheduleScore} size="sm" className="w-24" />
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono ${row.score.injuryRisk >= 50 ? "text-drop-400" : row.score.injuryRisk > 0 ? "text-sell-400" : "text-ink-200"}`}>
                      {Math.round(row.score.injuryRisk)}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-right font-mono ${
                        row.score.tdRatio >= 1.35 ? "text-sell-400" : row.score.tdRatio <= 0.7 && row.player.position !== "K" && row.player.position !== "DST" ? "text-buy-400" : "text-ink-200"
                      }`}
                    >
                      {row.score.tdRatio.toFixed(2)}x
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono font-bold ${scoreTextTone(row.score.composite)}`}>{Math.round(row.score.composite)}</td>
                    <td className="px-3 py-2.5">
                      <TrendIcon trend={row.score.trend} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Lineup check" subtitle="Where the engine's projected-points lineup differs from your current starters." icon={ArrowRightLeft}>
        {analysis.lineup.swaps.length === 0 ? (
          <p className="text-sm text-ink-200">Your current starters already match the optimal lineup for this week.</p>
        ) : (
          <ul className="space-y-2">
            {analysis.lineup.swaps.map((swap) => {
              const benchPlayer = playerById.get(swap.benchPlayerId);
              const starterPlayer = playerById.get(swap.starterPlayerId);
              if (!benchPlayer || !starterPlayer) return null;
              return (
                <li key={`${swap.slot}-${swap.benchPlayerId}`} className="flex flex-wrap items-center gap-2 rounded-lg bg-ink-900/60 px-3 py-2 text-sm">
                  <span className="rounded bg-ink-700 px-1.5 py-0.5 font-mono text-[11px] text-ink-200">{swap.slot}</span>
                  <span className="font-semibold text-shield-300">Start {benchPlayer.name}</span>
                  <span className="text-ink-300">over</span>
                  <span className="font-semibold text-ink-100">{starterPlayer.name}</span>
                  <span className="ml-auto font-mono text-xs text-shield-400">+{swap.pointSwing.toFixed(1)} pts</span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
