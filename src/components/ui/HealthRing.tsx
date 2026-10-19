import type { HealthGrade } from "@/utils/fantasyEngine";

interface HealthRingProps {
  value: number | null;
  grade?: HealthGrade;
  size?: number;
  stroke?: number;
}

const GRADE_COLORS: Record<HealthGrade, string> = {
  A: "#19e0a4",
  B: "#4cf0bd",
  C: "#fbbf24",
  D: "#fb923c",
  F: "#fb7185",
};

export function HealthRing({ value, grade, size = 120, stroke = 10 }: HealthRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = value === null ? 0 : Math.min(100, Math.max(0, value));
  const offset = circumference - (progress / 100) * circumference;
  const color = grade ? GRADE_COLORS[grade] : "#56698a";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#202a3c" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms ease-out, stroke 300ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-bold tracking-tight text-ink-100">{value === null ? "--" : Math.round(value)}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-300">{grade ? `Grade ${grade}` : "Index"}</span>
      </div>
    </div>
  );
}
