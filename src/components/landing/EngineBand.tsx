import { Caption, Eyebrow, Section } from "@/components/landing/Editorial";
import { ENGINE_CONFIG, type InjuryStatus, type Position } from "@/utils/fantasyEngine";

interface Signal {
  glyph: string;
  name: string;
  definition: string;
  formula: string;
  notes: string[];
}

export function EngineBand() {
  const config = ENGINE_CONFIG;
  const weights = config.recencyWeights.map((weight) => weight.toFixed(2)).join(" · ");
  const skillPositions: Position[] = ["QB", "RB", "WR", "TE"];
  const baselines = skillPositions.map((position) => `${position} ${config.volumeBaseline[position]}`).join(" · ");
  const rates = skillPositions.map((position) => `${position} ${config.tdRate[position].toFixed(3)}`).join(" · ");
  const statuses: InjuryStatus[] = ["Questionable", "Doubtful", "Out", "IR"];
  const risks = statuses.map((status) => `${status} ${config.injuryRisk[status]}`).join(" · ");

  const signals: Signal[] = [
    {
      glyph: "V",
      name: "Volume",
      definition: "Recency-weighted opportunities, meaning targets, carries and dropbacks, divided by a positional baseline.",
      formula: "V = Σ wᵢ · oᵢ ÷ b(pos)",
      notes: [`w = ${weights}`, `b = ${baselines}`],
    },
    {
      glyph: "S",
      name: "Schedule",
      definition: "The mean ease of every remaining opponent, where ease maps the defense’s rank against the position onto 0 to 100.",
      formula: "S = mean((rank − 1) ÷ 31 × 100)",
      notes: ["Rank 1 is the toughest defense", `Weeks ${config.currentWeek} to ${config.seasonWeeks}, byes excluded`],
    },
    {
      glyph: "H",
      name: "Health",
      definition: "Injury-report exposure, escalated 2.5 points for every expected week missed and capped at six weeks.",
      formula: "H = 100 − risk(status) − 2.5 · min(weeks, 6)",
      notes: [risks],
    },
  ];

  const composite = `C = ${config.compositeWeights.volume.toFixed(2)}·V + ${config.compositeWeights.schedule.toFixed(2)}·S + ${config.compositeWeights.health.toFixed(2)}·H`;

  return (
    <Section
      id="engine"
      index="02"
      label="Engine"
      dark
      title="Three signals. One composite."
      lede="Pure, deterministic TypeScript with no I/O. The same code runs inside the route handler, in the browser and in the report script, and it returns the same answer every time."
    >
      <div className="grid grid-cols-1 gap-px bg-paper/15 md:grid-cols-3">
        {signals.map((signal) => (
          <div key={signal.glyph} className="bg-graphite p-8 xl:p-10">
            <p className="font-display text-[5.5rem] italic leading-none tracking-[-0.03em]">{signal.glyph}</p>
            <Eyebrow className="mt-8 text-paper/60">{signal.name}</Eyebrow>
            <p className="mt-4 min-h-[5.5rem] text-[15px] leading-[1.6] text-paper/75">{signal.definition}</p>
            <p className="mt-8 border-t border-paper/15 pt-5 font-mono text-[13px] text-paper">{signal.formula}</p>
            <ul className="mt-3 space-y-1.5">
              {signal.notes.map((note) => (
                <li key={note} className="font-mono text-[11px] uppercase tracking-[0.1em] text-paper/50">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-px grid grid-cols-1 gap-px bg-paper/15 md:grid-cols-2">
        <div className="bg-graphite p-8 xl:p-10">
          <Eyebrow className="text-paper/60">Composite</Eyebrow>
          <p className="mt-6 font-display text-[clamp(1.9rem,3.2vw,3rem)] leading-[1.05] tracking-[-0.02em]">{composite}</p>
          <Caption className="mt-6 text-paper/50">Projected points add a matchup factor and an injury factor for the lineup decision</Caption>
        </div>
        <div className="bg-graphite p-8 xl:p-10">
          <Eyebrow className="text-paper/60">Touchdown sustainability</Eyebrow>
          <p className="mt-6 font-display text-[clamp(1.9rem,3.2vw,3rem)] leading-[1.05] tracking-[-0.02em]">τ = TD ÷ (O × r(pos))</p>
          <Caption className="mt-6 text-paper/50">
            O = season opportunities · Sell above {config.thresholds.sellHighTdRatio.toFixed(2)} · Buy below {config.thresholds.buyLowTdRatio.toFixed(2)} · r = {rates}
          </Caption>
        </div>
      </div>
    </Section>
  );
}
