import { ArrowRightLeft, CirclePlus, Crosshair, Trash, type LucideIcon } from "lucide-react";

import type { ActionPriority, ActionType, InjuryStatus, Position } from "@/utils/fantasyEngine";

export interface ActionMeta {
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  text: string;
  softBg: string;
  border: string;
  bar: string;
  ring: string;
}

export const ACTION_META: Record<ActionType, ActionMeta> = {
  SELL_HIGH: {
    title: "Who to Trade",
    subtitle: "Sell high",
    description: "Unsustainable touchdown rates or brutal upcoming matchups.",
    icon: ArrowRightLeft,
    text: "text-sell-400",
    softBg: "bg-sell-500/10",
    border: "border-sell-500/30",
    bar: "bg-sell-500",
    ring: "ring-sell-500/40",
  },
  BUY_LOW: {
    title: "Who to Trade For",
    subtitle: "Buy low",
    description: "High-upside targets with rising snap counts or soft schedules.",
    icon: Crosshair,
    text: "text-buy-400",
    softBg: "bg-buy-500/10",
    border: "border-buy-500/30",
    bar: "bg-buy-500",
    ring: "ring-buy-500/40",
  },
  DROP: {
    title: "Who to Drop",
    subtitle: "Clear the clutter",
    description: "Underperforming bench clutter, long-term injuries, stale streamers.",
    icon: Trash,
    text: "text-drop-400",
    softBg: "bg-drop-500/10",
    border: "border-drop-500/30",
    bar: "bg-drop-500",
    ring: "ring-drop-500/40",
  },
  PICK_UP: {
    title: "Who to Pick Up",
    subtitle: "Waiver priorities",
    description: "Priority waiver targets, trending handcuffs, immediate streamers.",
    icon: CirclePlus,
    text: "text-pickup-400",
    softBg: "bg-pickup-500/10",
    border: "border-pickup-500/30",
    bar: "bg-pickup-500",
    ring: "ring-pickup-500/40",
  },
};

export const ACTION_ORDER: readonly ActionType[] = ["SELL_HIGH", "BUY_LOW", "DROP", "PICK_UP"];

export const POSITION_STYLES: Record<Position, string> = {
  QB: "bg-rose-400/15 text-rose-300 ring-rose-400/30",
  RB: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30",
  WR: "bg-sky-400/15 text-sky-300 ring-sky-400/30",
  TE: "bg-amber-400/15 text-amber-300 ring-amber-400/30",
  K: "bg-violet-400/15 text-violet-300 ring-violet-400/30",
  DST: "bg-orange-400/15 text-orange-300 ring-orange-400/30",
};

export const STATUS_STYLES: Record<InjuryStatus, string> = {
  Healthy: "bg-shield-500/10 text-shield-300 ring-shield-500/30",
  Questionable: "bg-sell-500/10 text-sell-400 ring-sell-500/30",
  Doubtful: "bg-orange-400/10 text-orange-300 ring-orange-400/30",
  Out: "bg-drop-500/10 text-drop-400 ring-drop-500/30",
  IR: "bg-drop-500/15 text-drop-300 ring-drop-500/40",
};

export const PRIORITY_META: Record<ActionPriority, { label: string; className: string }> = {
  1: { label: "Act now", className: "bg-drop-500/15 text-drop-300 ring-drop-500/40" },
  2: { label: "This week", className: "bg-sell-500/15 text-sell-400 ring-sell-500/40" },
  3: { label: "Monitor", className: "bg-ink-600/60 text-ink-200 ring-ink-500/60" },
};

export function matchupTone(rank: number): string {
  if (rank <= 8) return "bg-drop-500/15 text-drop-300 ring-drop-500/30";
  if (rank >= 24) return "bg-pickup-500/15 text-pickup-300 ring-pickup-500/30";
  return "bg-ink-600/50 text-ink-200 ring-ink-500/50";
}

export function scoreTone(value: number): string {
  if (value >= 70) return "bg-shield-500";
  if (value >= 45) return "bg-sell-500";
  return "bg-drop-500";
}

export function scoreTextTone(value: number): string {
  if (value >= 70) return "text-shield-400";
  if (value >= 45) return "text-sell-400";
  return "text-drop-400";
}
