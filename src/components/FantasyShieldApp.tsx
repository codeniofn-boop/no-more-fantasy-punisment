"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListFilter, LoaderCircle, Shield, ShieldAlert, Sparkles, TriangleAlert, X, Zap } from "lucide-react";

import { ActionCenter } from "@/components/action-center/ActionCenter";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { MatchupOutlook } from "@/components/dashboard/MatchupOutlook";
import { Sidebar, type AppView } from "@/components/layout/Sidebar";
import { TopStats, type EngineStatus } from "@/components/layout/TopStats";
import { RosterDropzone } from "@/components/roster/RosterDropzone";
import { RosterTable } from "@/components/roster/RosterTable";
import { Panel } from "@/components/ui/Panel";
import { buildSampleRoster } from "@/data/players";
import { analyzeRosterRequest, ApiError } from "@/lib/api";
import { POSITIONS, type Position, type Roster, type RosterAnalysis } from "@/utils/fantasyEngine";

const STORAGE_KEY = "fantasyshield.roster.v1";

type PositionFilter = Position | "ALL";

function readStoredRoster(): Roster | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Roster>;
    if (!parsed || !Array.isArray(parsed.players) || parsed.players.length === 0) return null;
    return parsed as Roster;
  } catch {
    return null;
  }
}

function writeStoredRoster(roster: Roster | null): void {
  try {
    if (roster) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode, quota); the session still works in memory.
  }
}

export function FantasyShieldApp() {
  const [view, setView] = useState<AppView>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [roster, setRoster] = useState<Roster | null>(null);
  const [analysis, setAnalysis] = useState<RosterAnalysis | null>(null);
  const [status, setStatus] = useState<EngineStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [positionFilter, setPositionFilter] = useState<PositionFilter>("ALL");
  const [minConfidence, setMinConfidence] = useState(0);
  const requestCounter = useRef(0);

  const runAnalysis = useCallback(async (target: Roster) => {
    const requestId = ++requestCounter.current;
    setStatus("analyzing");
    setError(null);
    try {
      const response = await analyzeRosterRequest(target);
      if (requestId !== requestCounter.current) return;
      setRoster(response.roster);
      setAnalysis(response.analysis);
      setWarnings(response.warnings);
      setStatus("idle");
      writeStoredRoster(response.roster);
    } catch (caught) {
      if (requestId !== requestCounter.current) return;
      const message =
        caught instanceof ApiError
          ? [caught.message, ...caught.details].join(" ")
          : caught instanceof Error
            ? caught.message
            : "The engine request failed.";
      setStatus("error");
      setError(message);
    }
  }, []);

  const loadRoster = useCallback(
    (next: Roster) => {
      setRoster(next);
      setAnalysis(null);
      setWarnings([]);
      writeStoredRoster(next);
      setView("dashboard");
      void runAnalysis(next);
    },
    [runAnalysis],
  );

  const loadSample = useCallback(() => {
    loadRoster(buildSampleRoster(new Date().toISOString()));
  }, [loadRoster]);

  const clearRoster = useCallback(() => {
    requestCounter.current += 1;
    setRoster(null);
    setAnalysis(null);
    setWarnings([]);
    setError(null);
    setStatus("idle");
    writeStoredRoster(null);
  }, []);

  const exportRoster = useCallback(() => {
    if (!roster) return;
    const blob = new Blob([JSON.stringify(roster, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${roster.teamName.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "roster"}.fantasyshield.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, [roster]);

  useEffect(() => {
    const stored = readStoredRoster();
    if (!stored) return;
    const timer = window.setTimeout(() => {
      setRoster(stored);
      void runAnalysis(stored);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [runAnalysis]);

  const filteredActions = useMemo(() => {
    if (!analysis) return [];
    return analysis.actions.filter(
      (item) => (positionFilter === "ALL" || item.player.position === positionFilter) && item.confidence >= minConfidence,
    );
  }, [analysis, positionFilter, minConfidence]);

  const navigate = (next: AppView) => {
    setView(next);
    setMobileOpen(false);
  };

  const busy = status === "analyzing";
  const ready = roster !== null && analysis !== null;

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar view={view} onNavigate={navigate} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} roster={roster} analysis={analysis} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopStats
          roster={roster}
          analysis={analysis}
          status={status}
          errorMessage={error}
          onOpenMenu={() => setMobileOpen(true)}
          onRerun={() => {
            if (roster) void runAnalysis(roster);
          }}
        />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {warnings.length > 0 && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-sell-500/30 bg-sell-500/10 px-4 py-3 text-xs text-sell-400">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <ul className="flex-1 space-y-1">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
              <button type="button" onClick={() => setWarnings([])} className="rounded p-1 hover:bg-sell-500/20" aria-label="Dismiss warnings">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {status === "error" && roster && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-drop-500/30 bg-drop-500/10 px-4 py-3 text-xs text-drop-300">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="flex-1">{error}</p>
              <button
                type="button"
                onClick={() => void runAnalysis(roster)}
                className="rounded-lg border border-drop-500/40 px-2.5 py-1 font-semibold hover:bg-drop-500/15"
              >
                Retry
              </button>
            </div>
          )}

          {view === "dashboard" && (
            <>
              {ready ? (
                <DashboardView roster={roster} analysis={analysis} onNavigate={navigate} />
              ) : roster ? (
                <EngineLoading status={status} />
              ) : (
                <EmptyState onLoadSample={loadSample} onRosterReady={loadRoster} busy={busy} />
              )}
            </>
          )}

          {view === "roster" && (
            <div className="space-y-6">
              <RosterDropzone onRosterReady={loadRoster} onLoadSample={loadSample} busy={busy} />
              {ready && <RosterTable roster={roster} analysis={analysis} onExport={exportRoster} onClear={clearRoster} />}
              {roster && !analysis && <EngineLoading status={status} />}
            </div>
          )}

          {view === "actions" && (
            <>
              {ready ? (
                <div className="space-y-5">
                  <Panel
                    title="AI Action Center"
                    subtitle="Four lanes, every candidate, ranked by confidence. Filter to the position you need to fix."
                    icon={Zap}
                    action={
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-ink-200">
                          <ListFilter className="h-3.5 w-3.5 text-ink-300" />
                          <select
                            value={positionFilter}
                            onChange={(event) => setPositionFilter(event.target.value as PositionFilter)}
                            className="rounded-lg border border-ink-600 bg-ink-800 px-2 py-1.5 text-xs text-ink-100 focus:border-shield-500/60 focus:outline-none"
                          >
                            <option value="ALL">All positions</option>
                            {POSITIONS.map((position) => (
                              <option key={position} value={position}>
                                {position}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex items-center gap-2 text-xs text-ink-200">
                          Min confidence
                          <input
                            type="range"
                            min={0}
                            max={90}
                            step={5}
                            value={minConfidence}
                            onChange={(event) => setMinConfidence(Number(event.target.value))}
                            className="accent-shield-500"
                          />
                          <span className="w-7 font-mono text-ink-100">{minConfidence}</span>
                        </label>
                      </div>
                    }
                    bodyClassName="px-4 py-4"
                  >
                    <ActionCenter actions={filteredActions} />
                  </Panel>
                </div>
              ) : roster ? (
                <EngineLoading status={status} />
              ) : (
                <NeedsRoster onNavigate={navigate} onLoadSample={loadSample} />
              )}
            </>
          )}

          {view === "matchups" && (
            <>
              {ready ? (
                <MatchupOutlook roster={roster} analysis={analysis} />
              ) : roster ? (
                <EngineLoading status={status} />
              ) : (
                <NeedsRoster onNavigate={navigate} onLoadSample={loadSample} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function EngineLoading({ status }: { status: EngineStatus }) {
  return (
    <Panel bodyClassName="px-6 py-10">
      <div className="flex flex-col items-center text-center">
        {status === "error" ? (
          <ShieldAlert className="h-8 w-8 text-drop-400" />
        ) : (
          <LoaderCircle className="h-8 w-8 animate-spin text-shield-400" />
        )}
        <p className="mt-3 text-sm font-semibold text-ink-100">
          {status === "error" ? "The engine could not score this roster." : "Running the win engine"}
        </p>
        <p className="mt-1 max-w-md text-xs text-ink-300">
          {status === "error"
            ? "Use Retry above, or re-import the roster from the Roster Intake view."
            : "Weighting recent volume, remaining strength of schedule and injury-report risk for every player."}
        </p>
        {status !== "error" && (
          <div className="mt-6 w-full max-w-xl space-y-2">
            <div className="skeleton h-3 rounded-full" />
            <div className="skeleton h-3 w-5/6 rounded-full" />
            <div className="skeleton h-3 w-2/3 rounded-full" />
          </div>
        )}
      </div>
    </Panel>
  );
}

function EmptyState({ onLoadSample, onRosterReady, busy }: { onLoadSample: () => void; onRosterReady: (roster: Roster) => void; busy: boolean }) {
  return (
    <div className="space-y-6">
      <section className="panel grid-lines relative overflow-hidden rounded-2xl px-6 py-10 sm:px-10">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-shield-500/15 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-shield-500/40 bg-shield-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-shield-300">
            <Shield className="h-3.5 w-3.5" />
            Never lose your league again
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-100 sm:text-4xl">
            Automated, high-precision roster optimization.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-200 sm:text-base">
            FantasyShield scores every player on recent volume, remaining strength of schedule and injury risk, then tells you exactly who to
            trade, who to trade for, who to drop and who to pick up.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onLoadSample}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-shield-500 px-4 py-2.5 text-sm font-semibold text-ink-950 shadow-glow transition hover:bg-shield-400 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              Run the sample roster
            </button>
            <span className="self-center text-xs text-ink-300">or import your own below</span>
          </div>
        </div>
      </section>
      <RosterDropzone onRosterReady={onRosterReady} onLoadSample={onLoadSample} busy={busy} />
    </div>
  );
}

function NeedsRoster({ onNavigate, onLoadSample }: { onNavigate: (view: AppView) => void; onLoadSample: () => void }) {
  return (
    <Panel bodyClassName="px-6 py-10">
      <div className="flex flex-col items-center text-center">
        <Shield className="h-8 w-8 text-ink-400" />
        <p className="mt-3 text-sm font-semibold text-ink-100">No roster loaded yet</p>
        <p className="mt-1 max-w-md text-xs text-ink-300">Import a roster or run the sample to populate this view.</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => onNavigate("roster")}
            className="rounded-lg border border-ink-600 px-3 py-2 text-xs font-semibold text-ink-200 transition hover:text-ink-100"
          >
            Go to Roster Intake
          </button>
          <button
            type="button"
            onClick={onLoadSample}
            className="rounded-lg bg-shield-500 px-3 py-2 text-xs font-semibold text-ink-950 transition hover:bg-shield-400"
          >
            Load sample roster
          </button>
        </div>
      </div>
    </Panel>
  );
}
