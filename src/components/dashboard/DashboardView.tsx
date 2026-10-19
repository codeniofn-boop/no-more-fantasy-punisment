"use client";

import { Activity, CalendarDays, ChevronRight, Flame, HeartPulse, Layers, ShieldCheck, Zap } from "lucide-react";

import { ActionCenter } from "@/components/action-center/ActionCenter";
import type { AppView } from "@/components/layout/Sidebar";
import { PositionBadge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { ACTION_META, ACTION_ORDER, PRIORITY_META } from "@/lib/actionMeta";
import type { ActionItem, Player, PlayerScore, Roster, RosterAnalysis } from "@/utils/fantasyEngine";

interface DashboardViewProps {
  roster: Roster;
  analysis: RosterAnalysis;
  onNavigate: (view: AppView) => void;
}

function playbook(actions: ActionItem[]): ActionItem[] {
  const picked: ActionItem[] = [];
  for (const type of ACTION_ORDER) {
    const best = actions.filter((item) => item.type === type).sort((a, b) => b.confidence - a.confidence)[0];
    if (best) picked.push(best);
  }
  return picked.sort((a, b) => b.confidence - a.confidence);
}

interface MetricCard {
  key: "volume" | "schedule" | "injury" | "depth";
  label: string;
  icon: typeof Activity;
  blurb: string;
  detail: string;
}

function buildMetricCards(roster: Roster, analysis: RosterAnalysis): MetricCard[] {
  const playerById = new Map(roster.players.map((player) => [player.id, player]));
  const starterIds = new Set(analysis.lineup.starters.map((starter) => starter.playerId));
  const starters = analysis.scores.filter((score) => starterIds.has(score.playerId));
  const nameOf = (score: PlayerScore | undefined): string => (score ? (playerById.get(score.playerId)?.name ?? "") : "");

  const byVolume = [...starters].sort((a, b) => b.volumeScore - a.volumeScore);
  const bySchedule = [...starters].sort((a, b) => b.scheduleScore - a.scheduleScore);
  const hurt = roster.players.filter((player) => player.injury.status !== "Healthy");
  const benchTop = analysis.scores
    .filter((score) => !starterIds.has(score.playerId))
    .filter((score) => {
      const player = playerById.get(score.playerId);
      return player !== undefined && player.position !== "K" && player.position !== "DST";
    })
    .sort((a, b) => b.composite - a.composite)[0];

  return [
    {
      key: "volume",
      label: "Volume",
      icon: Activity,
      blurb: "Recency-weighted targets, carries and dropbacks for your starters against positional baselines.",
      detail: byVolume.length > 0 ? `Leader: ${nameOf(byVolume[0])} (${Math.round(byVolume[0].volumeScore)}). Weakest: ${nameOf(byVolume[byVolume.length - 1])} (${Math.round(byVolume[byVolume.length - 1].volumeScore)}).` : "No starters scored.",
    },
    {
      key: "schedule",
      label: "Schedule",
      icon: CalendarDays,
      blurb: "Remaining strength of schedule from each opponent's fantasy points allowed to the position.",
      detail: bySchedule.length > 0 ? `Softest road: ${nameOf(bySchedule[0])} (${Math.round(bySchedule[0].scheduleScore)}). Toughest: ${nameOf(bySchedule[bySchedule.length - 1])} (${Math.round(bySchedule[bySchedule.length - 1].scheduleScore)}).` : "No starters scored.",
    },
    {
      key: "injury",
      label: "Health",
      icon: HeartPulse,
      blurb: "Injury-report exposure weighted toward starters; long absences escalate the risk.",
      detail: hurt.length === 0 ? "Every rostered player is listed Healthy." : `${hurt.length} flagged: ${hurt.map((player) => `${player.name} (${player.injury.status})`).join(", ")}.`,
    },
    {
      key: "depth",
      label: "Depth",
      icon: Layers,
      blurb: "Quality of your top bench assets plus coverage of every lineup slot.",
      detail: benchTop ? `Best bench asset: ${nameOf(benchTop)} at composite ${Math.round(benchTop.composite)}. ${analysis.lineup.starters.length}/10 lineup slots filled.` : "No bench skill players to evaluate.",
    },
  ];
}

function byeWatch(roster: Roster, currentWeek: number): Array<{ week: number; players: Player[] }> {
  return [currentWeek, currentWeek + 1, currentWeek + 2]
    .map((week) => ({ week, players: roster.players.filter((player) => player.byeWeek === week) }))
    .filter((entry) => entry.players.length > 0);
}

export function DashboardView({ roster, analysis, onNavigate }: DashboardViewProps) {
  const moves = playbook(analysis.actions);
  const metrics = buildMetricCards(roster, analysis);
  const byes = byeWatch(roster, analysis.currentWeek);
  const playerById = new Map(roster.players.map((player) => [player.id, player]));

  return (
    <div className="space-y-6">
      <Panel
        title="This week's playbook"
        subtitle="The single highest-confidence move in each lane. Execute these before the waiver run."
        icon={Flame}
        action={
          <button
            type="button"
            onClick={() => onNavigate("actions")}
            className="inline-flex items-center gap-1 rounded-lg border border-ink-600 px-3 py-1.5 text-xs font-semibold text-ink-200 transition hover:text-ink-100"
          >
            Open Action Center
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        }
      >
        {moves.length === 0 ? (
          <p className="text-sm text-ink-200">The engine found no moves that clear its confidence bar. Hold the roster.</p>
        ) : (
          <ol className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
            {moves.map((item, index) => {
              const meta = ACTION_META[item.type];
              const Icon = meta.icon;
              const priority = PRIORITY_META[item.priority];
              return (
                <li key={item.id} className={`flex gap-3 rounded-xl border ${meta.border} bg-ink-900/60 p-3`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.softBg} ring-1 ${meta.ring} ${meta.text}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${meta.text}`}>
                      {index + 1}. {meta.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-sm font-bold text-ink-100">
                      <PositionBadge position={item.player.position} className="h-5 min-w-7 text-[10px]" />
                      <span className="truncate">{item.player.name}</span>
                    </p>
                    <p className="mt-1 text-xs text-ink-200">{item.headline}</p>
                    <div className="mt-2 flex items-center gap-2 text-[11px]">
                      <span className={`rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset ${priority.className}`}>{priority.label}</span>
                      <span className={`font-mono font-semibold ${meta.text}`}>{item.confidence}% confidence</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const value = analysis.health[metric.key];
          return (
            <Panel key={metric.key} className="h-full" bodyClassName="px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-ink-100">
                  <Icon className="h-4 w-4 text-shield-400" />
                  {metric.label}
                </span>
                <span className="font-mono text-2xl font-bold text-ink-100">{Math.round(value)}</span>
              </div>
              <ScoreBar value={value} showValue={false} className="mt-3" />
              <p className="mt-3 text-xs text-ink-300">{metric.blurb}</p>
              <p className="mt-2 text-xs font-medium text-ink-200">{metric.detail}</p>
            </Panel>
          );
        })}
      </div>

      <Panel
        title="AI Action Center"
        subtitle="Top three in every lane. The full matrix lives in the Action Center view."
        icon={Zap}
        bodyClassName="px-4 py-4"
      >
        <ActionCenter actions={analysis.actions} limit={3} compact onViewAll={() => onNavigate("actions")} />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Lineup check" subtitle="Projected-points lineup versus your current starters." icon={ShieldCheck}>
          {analysis.lineup.swaps.length === 0 ? (
            <p className="text-sm text-ink-200">Your starters match the engine&apos;s optimal lineup for week {analysis.currentWeek}.</p>
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
                    <span className="text-ink-300">over {starterPlayer.name}</span>
                    <span className="ml-auto font-mono text-xs text-shield-400">+{swap.pointSwing.toFixed(1)} pts</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Bye-week watch" subtitle="Who is idle this week and the two after it." icon={CalendarDays}>
          {byes.length === 0 ? (
            <p className="text-sm text-ink-200">No byes on your roster through week {analysis.currentWeek + 2}.</p>
          ) : (
            <ul className="space-y-2">
              {byes.map((entry) => (
                <li key={entry.week} className="rounded-lg bg-ink-900/60 px-3 py-2">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-300">Week {entry.week}</p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {entry.players.map((player) => (
                      <span key={player.id} className="flex items-center gap-1.5 rounded-md bg-ink-700 px-2 py-1 text-xs text-ink-100 ring-1 ring-ink-600">
                        <PositionBadge position={player.position} className="h-5 min-w-7 text-[10px]" />
                        {player.name}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
