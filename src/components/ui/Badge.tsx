import type { ReactNode } from "react";

import { POSITION_STYLES, STATUS_STYLES } from "@/lib/actionMeta";
import type { InjuryStatus, Position } from "@/utils/fantasyEngine";

export function PositionBadge({ position, className = "" }: { position: Position; className?: string }) {
  return (
    <span
      className={`inline-flex h-6 min-w-9 items-center justify-center rounded-md px-1.5 font-mono text-[11px] font-semibold tracking-wide ring-1 ring-inset ${POSITION_STYLES[position]} ${className}`}
    >
      {position}
    </span>
  );
}

export function StatusBadge({ status, detail }: { status: InjuryStatus; detail?: string }) {
  const label = detail && status !== "Healthy" ? `${status} · ${detail}` : status;
  return (
    <span
      className={`inline-flex h-6 items-center rounded-md px-2 text-[11px] font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}
      title={label}
    >
      {label}
    </span>
  );
}

export type TagTone = "neutral" | "shield" | "sell" | "buy" | "drop" | "pickup";

const TAG_TONES: Record<TagTone, string> = {
  neutral: "bg-ink-600/50 text-ink-200 ring-ink-500/60",
  shield: "bg-shield-500/10 text-shield-300 ring-shield-500/30",
  sell: "bg-sell-500/10 text-sell-400 ring-sell-500/30",
  buy: "bg-buy-500/10 text-buy-400 ring-buy-500/30",
  drop: "bg-drop-500/10 text-drop-400 ring-drop-500/30",
  pickup: "bg-pickup-500/10 text-pickup-400 ring-pickup-500/30",
};

export function Tag({ children, tone = "neutral", className = "" }: { children: ReactNode; tone?: TagTone; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${TAG_TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}
