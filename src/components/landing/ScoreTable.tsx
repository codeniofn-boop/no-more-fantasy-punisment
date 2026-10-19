import { Caption } from "@/components/landing/Editorial";
import type { RosterRow } from "@/lib/rosterRows";

function Metric({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center gap-3">
      <span className="tnum w-7 font-mono text-[12px] text-ink">{Math.round(clamped)}</span>
      <div className="h-[2px] w-20 bg-mist xl:w-24">
        <div className="h-full bg-ink" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

function Th({ children, align = "left" }: { children: string; align?: "left" | "right" }) {
  return (
    <th scope="col" className={`py-3 pr-4 font-mono text-[11px] font-normal uppercase tracking-[0.12em] text-ash ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

export function ScoreTable({ rows, week }: { rows: RosterRow[]; week: number }) {
  return (
    <figure>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-ink/40">
              <Th>Slot</Th>
              <Th>Player</Th>
              <Th>Pos</Th>
              <Th>Team</Th>
              <Th>Volume</Th>
              <Th>Schedule</Th>
              <Th align="right">Risk</Th>
              <Th align="right">TD ratio</Th>
              <Th align="right">Proj</Th>
              <Th align="right">Composite</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const divider = index > 0 && rows[index - 1].isStarter && !row.isStarter;
              return (
                <tr key={row.player.id} className={`border-t ${divider ? "border-ink/40" : "border-ink/10"}`}>
                  <td className="py-3 pr-4 font-mono text-[11px] uppercase tracking-[0.12em] text-ash">{row.slotLabel}</td>
                  <td className={`py-3 pr-4 text-[15px] ${row.isStarter ? "font-medium text-ink" : "text-ink/75"}`}>{row.player.name}</td>
                  <td className="py-3 pr-4 font-mono text-[12px] text-ink/70">{row.player.position}</td>
                  <td className="py-3 pr-4 font-mono text-[12px] text-ink/70">{row.player.team}</td>
                  <td className="py-3 pr-4">
                    <Metric value={row.score.volumeScore} />
                  </td>
                  <td className="py-3 pr-4">
                    <Metric value={row.score.scheduleScore} />
                  </td>
                  <td className="tnum py-3 pr-4 text-right font-mono text-[12px] text-ink/70">{Math.round(row.score.injuryRisk)}</td>
                  <td className="tnum py-3 pr-4 text-right font-mono text-[12px] text-ink/70">{row.score.tdRatio.toFixed(2)}</td>
                  <td className="tnum py-3 pr-4 text-right font-mono text-[12px] text-ink/70">{row.score.projectedPoints.toFixed(1)}</td>
                  <td className="tnum py-3 text-right font-mono text-[13px] font-medium text-ink">{Math.round(row.score.composite)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Caption className="mt-5">
        Table 01 — Player scoring, week {week}. Starters follow the engine’s projected-points lineup. Volume and schedule are 0–100; risk is injury exposure.
      </Caption>
      <Caption className="mt-2 lg:hidden">Scroll horizontally for every column.</Caption>
    </figure>
  );
}
