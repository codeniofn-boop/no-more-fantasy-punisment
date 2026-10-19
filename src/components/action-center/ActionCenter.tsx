"use client";

import { ChevronRight } from "lucide-react";

import { ActionCard } from "@/components/action-center/ActionCard";
import { ACTION_META, ACTION_ORDER } from "@/lib/actionMeta";
import type { ActionItem, ActionType } from "@/utils/fantasyEngine";

const EMPTY_COPY: Record<ActionType, string> = {
  SELL_HIGH: "No inflated touchdown rates or brutal three-week stretches among your tradeable starters.",
  BUY_LOW: "No rostered players in the league universe are showing rising snaps, soft schedules or unlucky scoring right now.",
  DROP: "Your bench is clean: no long-term injuries, dead-weight volume or stale streamers.",
  PICK_UP: "Nothing on the wire clears the bar this week. Check again after the waiver run.",
};

interface ActionCenterProps {
  actions: ActionItem[];
  limit?: number;
  compact?: boolean;
  onViewAll?: () => void;
}

export function ActionCenter({ actions, limit, compact = false, onViewAll }: ActionCenterProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {ACTION_ORDER.map((type) => {
        const meta = ACTION_META[type];
        const Icon = meta.icon;
        const items = actions.filter((item) => item.type === type);
        const visible = limit ? items.slice(0, limit) : items;
        const hidden = items.length - visible.length;
        return (
          <section key={type} className={`flex flex-col rounded-2xl border ${meta.border} ${meta.softBg} p-3`} aria-labelledby={`column-${type}`}>
            <header className="flex items-start justify-between gap-2 px-1 pb-3">
              <div className="flex items-start gap-2.5">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-900/80 ring-1 ${meta.ring} ${meta.text}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <h3 id={`column-${type}`} className="text-sm font-bold text-ink-100">
                    {meta.title}
                  </h3>
                  <p className={`text-[11px] font-semibold uppercase tracking-wider ${meta.text}`}>{meta.subtitle}</p>
                  {!compact && <p className="mt-1 text-[11px] text-ink-300">{meta.description}</p>}
                </div>
              </div>
              <span className="rounded-full bg-ink-900/80 px-2 py-0.5 font-mono text-[11px] font-semibold text-ink-100 ring-1 ring-ink-600">{items.length}</span>
            </header>

            <div className="flex flex-1 flex-col gap-3">
              {visible.length === 0 ? (
                <p className="rounded-xl border border-dashed border-ink-500 bg-ink-900/50 p-4 text-xs leading-relaxed text-ink-300">{EMPTY_COPY[type]}</p>
              ) : (
                visible.map((item) => <ActionCard key={item.id} item={item} compact={compact} />)
              )}
            </div>

            {hidden > 0 && onViewAll && (
              <button
                type="button"
                onClick={onViewAll}
                className={`mt-3 inline-flex items-center justify-center gap-1 rounded-lg bg-ink-900/70 px-3 py-2 text-xs font-semibold ring-1 ring-ink-600 transition hover:ring-ink-400 ${meta.text}`}
              >
                {hidden} more in the Action Center
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}
