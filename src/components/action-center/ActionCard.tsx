"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react";

import { PositionBadge, StatusBadge, Tag, type TagTone } from "@/components/ui/Badge";
import { ScoreBar, type BarTone } from "@/components/ui/ScoreBar";
import { ACTION_META, PRIORITY_META } from "@/lib/actionMeta";
import type { ActionItem, ActionType } from "@/utils/fantasyEngine";

const TONE_BY_TYPE: Record<ActionType, TagTone & BarTone> = {
  SELL_HIGH: "sell",
  BUY_LOW: "buy",
  DROP: "drop",
  PICK_UP: "pickup",
};

interface ActionCardProps {
  item: ActionItem;
  compact?: boolean;
}

export function ActionCard({ item, compact = false }: ActionCardProps) {
  const [expanded, setExpanded] = useState(!compact);
  const meta = ACTION_META[item.type];
  const priority = PRIORITY_META[item.priority];
  const tone = TONE_BY_TYPE[item.type];
  const visibleReasons = expanded ? item.reasons : item.reasons.slice(0, 1);
  const hiddenCount = item.reasons.length - visibleReasons.length;
  const swingPositive = item.projectedWeeklySwing >= 0;

  return (
    <article className={`animate-rise rounded-xl border ${meta.border} bg-ink-800/80 p-4 shadow-panel`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <PositionBadge position={item.player.position} className="mt-0.5" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink-100">{item.player.name}</p>
            <p className="font-mono text-[11px] text-ink-300">
              {item.player.team} · bye {item.player.byeWeek} · {item.player.rosteredPct}% rostered
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className={`font-mono text-xl font-bold leading-none ${meta.text}`}>{item.confidence}</p>
          <p className="text-[10px] uppercase tracking-wider text-ink-400">confidence</p>
        </div>
      </div>

      {item.player.injury.status !== "Healthy" && (
        <div className="mt-2">
          <StatusBadge status={item.player.injury.status} detail={item.player.injury.detail || undefined} />
        </div>
      )}

      <p className="mt-3 text-sm font-medium text-ink-100">{item.headline}</p>
      <ScoreBar value={item.confidence} tone={tone} showValue={false} size="sm" className="mt-2" />

      <ul className="mt-3 space-y-1.5">
        {visibleReasons.map((reason) => (
          <li key={reason} className="flex gap-2 text-xs leading-relaxed text-ink-200">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${meta.bar}`} />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-ink-300 hover:text-ink-100"
        >
          <ChevronRight className="h-3 w-3" />
          {hiddenCount} more reason{hiddenCount === 1 ? "" : "s"}
        </button>
      )}

      {item.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <Tag key={tag} tone={tone}>
              {tag}
            </Tag>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-600/70 pt-3 text-[11px]">
        <span className={`rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset ${priority.className}`}>{priority.label}</span>
        <span className={`inline-flex items-center gap-1 font-mono ${swingPositive ? "text-shield-400" : "text-drop-400"}`}>
          {swingPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {swingPositive ? "+" : ""}
          {item.projectedWeeklySwing.toFixed(1)} pts/wk
        </span>
        {item.counterpart && (
          <span className="ml-auto truncate text-ink-300">
            {item.counterpart.label}: <span className="font-semibold text-ink-100">{item.counterpart.name}</span>{" "}
            <span className="font-mono">
              ({item.counterpart.position}, {item.counterpart.team})
            </span>
          </span>
        )}
      </div>
    </article>
  );
}
