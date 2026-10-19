import { Caption } from "@/components/landing/Editorial";
import { getDefenseRank, getMatchup, SEASON_WEEKS } from "@/data/teams";
import type { RosterRow } from "@/lib/rosterRows";

const WEEKS_SHOWN = 5;

function cellTone(rank: number): string {
  if (rank <= 8) return "bg-ink text-paper";
  if (rank >= 24) return "bg-mist text-ink";
  return "border border-ink/15 text-ink/80";
}

export function MatchupGrid({ rows, currentWeek }: { rows: RosterRow[]; currentWeek: number }) {
  const weeks: number[] = [];
  for (let week = currentWeek; week < currentWeek + WEEKS_SHOWN && week <= SEASON_WEEKS; week++) weeks.push(week);

  return (
    <figure>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-ink/40">
              <th scope="col" className="py-3 pr-4 text-left font-mono text-[11px] font-normal uppercase tracking-[0.12em] text-ash">
                Player
              </th>
              {weeks.map((week) => (
                <th key={week} scope="col" className="py-3 px-2 text-center font-mono text-[11px] font-normal uppercase tracking-[0.12em] text-ash">
                  Wk {week}
                </th>
              ))}
              <th scope="col" className="py-3 pl-4 text-left font-mono text-[11px] font-normal uppercase tracking-[0.12em] text-ash">
                Remaining
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const divider = index > 0 && rows[index - 1].isStarter && !row.isStarter;
              return (
                <tr key={row.player.id} className={`border-t ${divider ? "border-ink/40" : "border-ink/10"}`}>
                  <td className="py-2.5 pr-4">
                    <span className={`text-[14px] ${row.isStarter ? "font-medium text-ink" : "text-ink/75"}`}>{row.player.name}</span>
                    <span className="ml-3 font-mono text-[11px] uppercase tracking-[0.1em] text-ash">
                      {row.player.position} · {row.player.team}
                    </span>
                  </td>
                  {weeks.map((week) => {
                    const opponent = getMatchup(row.player.team, week);
                    if (!opponent) {
                      return (
                        <td key={week} className="px-2 py-2.5 text-center">
                          <span className="inline-flex h-8 min-w-[4.5rem] items-center justify-center rounded-[2px] border border-dashed border-ink/25 font-mono text-[11px] uppercase tracking-[0.1em] text-ash">
                            Bye
                          </span>
                        </td>
                      );
                    }
                    const rank = getDefenseRank(opponent, row.player.position);
                    return (
                      <td key={week} className="px-2 py-2.5 text-center">
                        <span className={`tnum inline-flex h-8 min-w-[4.5rem] items-center justify-center gap-1.5 rounded-[2px] font-mono text-[11px] ${cellTone(rank)}`}>
                          {opponent}
                          <span className="opacity-60">{rank}</span>
                        </span>
                      </td>
                    );
                  })}
                  <td className="py-2.5 pl-4">
                    <div className="flex items-center gap-3">
                      <span className="tnum w-7 font-mono text-[12px] text-ink">{Math.round(row.score.scheduleScore)}</span>
                      <div className="h-[2px] w-24 bg-mist">
                        <div className="h-full bg-ink" style={{ width: `${Math.min(100, Math.max(0, row.score.scheduleScore))}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-2">
        <Caption className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 bg-ink" /> Top-eight defense
        </Caption>
        <Caption className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 border border-ink/25" /> Middle of the league
        </Caption>
        <Caption className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 bg-mist" /> Softest nine
        </Caption>
        <Caption className="ml-auto">Table 02 — Opponent rank versus position, weeks {weeks[0]} to {weeks[weeks.length - 1]}</Caption>
      </div>
      <Caption className="mt-2 lg:hidden">Scroll horizontally for every week.</Caption>
    </figure>
  );
}
