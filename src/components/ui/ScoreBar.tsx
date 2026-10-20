import { scoreTextTone, scoreTone } from "@/lib/actionMeta";

export type BarTone = "auto" | "shield" | "sell" | "buy" | "drop" | "pickup" | "neutral";

const BAR_TONES: Record<Exclude<BarTone, "auto">, string> = {
  shield: "bg-shield-500",
  sell: "bg-sell-500",
  buy: "bg-buy-500",
  drop: "bg-drop-500",
  pickup: "bg-pickup-500",
  neutral: "bg-ink-300",
};

interface ScoreBarProps {
  value: number;
  label?: string;
  tone?: BarTone;
  showValue?: boolean;
  suffix?: string;
  size?: "sm" | "md";
  className?: string;
}

export function ScoreBar({ value, label, tone = "auto", showValue = true, suffix = "", size = "md", className = "" }: ScoreBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const fill = tone === "auto" ? scoreTone(clamped) : BAR_TONES[tone];
  const text = tone === "auto" ? scoreTextTone(clamped) : "text-ink-100";
  const height = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="mb-1 flex items-center justify-between gap-2 text-xs">
          {label ? <span className="text-ink-300">{label}</span> : <span />}
          {showValue && (
            <span className={`font-mono font-semibold ${text}`}>
              {Math.round(clamped)}
              {suffix}
            </span>
          )}
        </div>
      )}
      <div className={`${height} w-full overflow-hidden rounded-full bg-ink-700`}>
        <div className={`${height} rounded-full ${fill} transition-[width] duration-500`} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
