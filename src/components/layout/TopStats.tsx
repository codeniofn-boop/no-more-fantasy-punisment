"use client";

import { Activity, CalendarDays, HeartPulse, Layers, LoaderCircle, Menu, RefreshCw, TriangleAlert } from "lucide-react";

import { HealthRing } from "@/components/ui/HealthRing";
import { ScoreBar } from "@/components/ui/ScoreBar";
import { ENGINE_CONFIG, type Roster, type RosterAnalysis } from "@/utils/fantasyEngine";

export type EngineStatus = "idle" | "analyzing" | "error";

interface TopStatsProps {
  roster: Roster | null;
  analysis: RosterAnalysis | null;
  status: EngineStatus;
  errorMessage: string | null;
  onOpenMenu: () => void;
  onRerun: () => void;
}

const METRICS = [
  { key: "volume", label: "Volume", hint: "Recent targets and touches", icon: Activity },
  { key: "schedule", label: "Schedule", hint: "Remaining strength of schedule", icon: CalendarDays },
  { key: "injury", label: "Health", hint: "Injury report exposure", icon: HeartPulse },
  { key: "depth", label: "Depth", hint: "Bench quality and coverage", icon: Layers },
] as const;

export function TopStats({ roster, analysis, status, errorMessage, onOpenMenu, onRerun }: TopStatsProps) {
  const health = analysis?.health ?? null;
  const week = analysis?.currentWeek ?? ENGINE_CONFIG.currentWeek;
  const remaining = analysis?.weeksRemaining ?? ENGINE_CONFIG.seasonWeeks - ENGINE_CONFIG.currentWeek + 1;

  return (
    <header className="sticky top-0 z-30 border-b border-ink-600/70 bg-ink-950/85 backdrop-blur">
      <div className="flex flex-wrap items-center gap-4 px-4 py-4 sm:px-6 lg:px-8 2xl:flex-nowrap">
        <div className="flex min-w-0 grow basis-[420px] items-center gap-4">
          <button
            type="button"
            onClick={onOpenMenu}
            className="rounded-lg border border-ink-600 p-2 text-ink-200 hover:bg-ink-700 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <HealthRing value={health ? health.overall : null} grade={health?.grade} size={96} stroke={9} />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-300">Current Team Health Index</p>
            {status === "analyzing" ? (
              <p className="mt-1 flex items-center gap-2 text-sm text-ink-200">
                <LoaderCircle className="h-4 w-4 animate-spin text-shield-400" />
                Running the win engine on {roster?.players.length ?? 0} players
              </p>
            ) : status === "error" ? (
              <p className="mt-1 flex items-center gap-2 text-sm text-drop-300">
                <TriangleAlert className="h-4 w-4" />
                {errorMessage ?? "The engine could not analyze this roster."}
              </p>
            ) : health ? (
              <p className="mt-1 max-w-xl text-sm text-ink-200">{health.summary}</p>
            ) : (
              <p className="mt-1 max-w-xl text-sm text-ink-300">Load a roster to compute volume, schedule, health and depth.</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded-full bg-ink-700 px-2.5 py-1 font-mono font-semibold text-ink-100 ring-1 ring-ink-600">
                Week {week}
              </span>
              <span className="rounded-full bg-ink-700 px-2.5 py-1 text-ink-200 ring-1 ring-ink-600">{remaining} weeks remaining</span>
              {roster && (
                <span className="truncate rounded-full bg-ink-700 px-2.5 py-1 text-ink-200 ring-1 ring-ink-600">
                  {roster.teamName} · {roster.players.length} players
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="order-last grid w-full grid-cols-2 gap-3 sm:grid-cols-4 2xl:order-none 2xl:w-[560px] 2xl:shrink-0">
          {METRICS.map((metric) => {
            const Icon = metric.icon;
            const value = health ? health[metric.key] : null;
            return (
              <div key={metric.key} className="rounded-xl border border-ink-600/80 bg-ink-800/70 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-200">
                    <Icon className="h-3.5 w-3.5 text-shield-400" />
                    {metric.label}
                  </span>
                  <span className="font-mono text-sm font-bold text-ink-100">{value === null ? "--" : Math.round(value)}</span>
                </div>
                {status === "analyzing" ? (
                  <div className="skeleton mt-2 h-2 rounded-full" />
                ) : (
                  <ScoreBar value={value ?? 0} showValue={false} size="sm" className="mt-2" tone={value === null ? "neutral" : "auto"} />
                )}
                <p className="mt-1.5 truncate text-[11px] text-ink-400">{metric.hint}</p>
              </div>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={onRerun}
            disabled={!roster || status === "analyzing"}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-xs font-semibold text-ink-100 transition hover:border-shield-500/50 hover:text-shield-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${status === "analyzing" ? "animate-spin" : ""}`} />
            Re-run engine
          </button>
        </div>
      </div>
    </header>
  );
}
