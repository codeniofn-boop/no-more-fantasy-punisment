"use client";

import { CalendarDays, LayoutDashboard, Shield, Users, X, Zap, type LucideIcon } from "lucide-react";

import type { Roster, RosterAnalysis } from "@/utils/fantasyEngine";

export type AppView = "dashboard" | "roster" | "actions" | "matchups";

export interface NavItem {
  view: AppView;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { view: "dashboard", label: "Dashboard", description: "Health index and weekly playbook", icon: LayoutDashboard },
  { view: "roster", label: "Roster Intake", description: "Upload, paste or import a league", icon: Users },
  { view: "actions", label: "Action Center", description: "Trade, buy, drop and pick up", icon: Zap },
  { view: "matchups", label: "Matchup Outlook", description: "Five-week schedule heat map", icon: CalendarDays },
];

const SOURCE_LABELS: Record<Roster["source"], string> = {
  upload: "File upload",
  paste: "Pasted text",
  espn: "ESPN import",
  yahoo: "Yahoo import",
  sample: "Sample roster",
};

interface SidebarProps {
  view: AppView;
  onNavigate: (view: AppView) => void;
  mobileOpen: boolean;
  onClose: () => void;
  roster: Roster | null;
  analysis: RosterAnalysis | null;
}

export function Sidebar({ view, onNavigate, mobileOpen, onClose, roster, analysis }: SidebarProps) {
  const actionCount = analysis?.actions.length ?? 0;
  const urgentCount = analysis?.actions.filter((item) => item.priority === 1).length ?? 0;

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-shield-500/15 text-shield-400 shadow-glow ring-1 ring-shield-500/40">
            <Shield className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-bold tracking-tight text-ink-100">FantasyShield</p>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-300">Win Engine</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-ink-300 hover:bg-ink-700 hover:text-ink-100 lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const active = item.view === view;
          const Icon = item.icon;
          const badge = item.view === "actions" && actionCount > 0 ? actionCount : null;
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => onNavigate(item.view)}
              aria-current={active ? "page" : undefined}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                active ? "bg-shield-500/10 text-ink-100 ring-1 ring-shield-500/30" : "text-ink-200 hover:bg-ink-700/70 hover:text-ink-100"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ${
                  active ? "bg-shield-500/15 text-shield-400 ring-shield-500/40" : "bg-ink-700 text-ink-300 ring-ink-600 group-hover:text-ink-100"
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="block truncate text-[11px] text-ink-300">{item.description}</span>
              </span>
              {badge !== null && (
                <span className="rounded-full bg-ink-600 px-2 py-0.5 font-mono text-[11px] font-semibold text-ink-100 ring-1 ring-ink-500">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-4 pb-5 pt-4">
        <div className="rounded-xl border border-ink-600/80 bg-ink-800/80 p-4">
          {roster ? (
            <>
              <p className="truncate text-sm font-semibold text-ink-100">{roster.teamName}</p>
              <p className="truncate text-xs text-ink-300">{roster.leagueName}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <dt className="text-ink-400">Players</dt>
                  <dd className="font-mono font-semibold text-ink-100">{roster.players.length}</dd>
                </div>
                <div>
                  <dt className="text-ink-400">Source</dt>
                  <dd className="font-semibold text-ink-100">{SOURCE_LABELS[roster.source]}</dd>
                </div>
                <div>
                  <dt className="text-ink-400">Moves</dt>
                  <dd className="font-mono font-semibold text-ink-100">{actionCount}</dd>
                </div>
                <div>
                  <dt className="text-ink-400">Urgent</dt>
                  <dd className={`font-mono font-semibold ${urgentCount > 0 ? "text-drop-400" : "text-ink-100"}`}>{urgentCount}</dd>
                </div>
              </dl>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-ink-100">No roster loaded</p>
              <p className="mt-1 text-xs text-ink-300">Import a roster to unlock the Action Center and health tracking.</p>
            </>
          )}
        </div>
        <p className="mt-3 px-1 text-[10px] uppercase tracking-[0.18em] text-ink-400">Engine v1 · Deterministic simulation</p>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-72 shrink-0 border-r border-ink-600/70 bg-ink-900/70 backdrop-blur lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        {content}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button type="button" className="absolute inset-0 bg-ink-950/75" onClick={onClose} aria-label="Close navigation overlay" />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-ink-600/70 bg-ink-900 shadow-2xl">{content}</aside>
        </div>
      )}
    </>
  );
}
