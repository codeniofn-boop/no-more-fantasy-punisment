import { Caption, Eyebrow } from "@/components/landing/Editorial";
import { Reveal } from "@/components/landing/Reveal";
import { ACTION_ORDER } from "@/lib/actionMeta";
import type { ActionItem, ActionType, RosterAnalysis } from "@/utils/fantasyEngine";

const LANES: Record<ActionType, { title: string; subtitle: string; description: string }> = {
  SELL_HIGH: {
    title: "Who to trade",
    subtitle: "Sell high",
    description: "Players whose touchdown rate has outrun their usage, or whose next three opponents are brutal. Move them while the box score still looks strong.",
  },
  BUY_LOW: {
    title: "Who to trade for",
    subtitle: "Buy low",
    description: "Rising snap shares, soft remaining schedules and unlucky scoring on strong usage. Ask before the production catches up with the role.",
  },
  DROP: {
    title: "Who to drop",
    subtitle: "Clear the clutter",
    description: "Long-term injuries, bench clutter with no path to the lineup, and kickers or defenses whose streaming window has closed.",
  },
  PICK_UP: {
    title: "Who to pick up",
    subtitle: "Waiver priorities",
    description: "Trending handcuffs for hurt starters, ascending waiver-wire roles and immediate streamers with plus matchups.",
  },
};

const PRIORITY_LABEL: Record<ActionItem["priority"], string> = { 1: "Act now", 2: "This week", 3: "Monitor" };

export function LaneList({ analysis }: { analysis: RosterAnalysis }) {
  return (
    <ol className="border-t border-ink/40">
      {ACTION_ORDER.map((type, index) => {
        const lane = LANES[type];
        const items = analysis.actions.filter((item) => item.type === type);
        const best = items[0];
        return (
          <li key={type} className="border-b border-ink/15">
            <Reveal delay={index * 60}>
              <div className="grid grid-cols-12 gap-x-6 gap-y-8 py-12">
                <div className="col-span-12 md:col-span-1">
                  <p className="tnum font-display text-[3rem] leading-none tracking-[-0.02em]">0{index + 1}</p>
                </div>
                <div className="col-span-12 md:col-span-4">
                  <h3 className="font-display text-[2rem] leading-[1.02] tracking-[-0.02em]">{lane.title}</h3>
                  <Eyebrow className="mt-2 text-ash">{lane.subtitle}</Eyebrow>
                  <p className="mt-5 max-w-[36ch] text-[15px] leading-[1.6] text-ink/75">{lane.description}</p>
                  <Caption className="mt-6">
                    {items.length} candidate{items.length === 1 ? "" : "s"} this week
                  </Caption>
                </div>
                <div className="col-span-12 md:col-span-7 md:border-l md:border-ink/15 md:pl-8">
                  {best ? (
                    <div>
                      <div className="flex items-start justify-between gap-6">
                        <div>
                          <Eyebrow className="text-ash">Top candidate</Eyebrow>
                          <p className="mt-3 font-display text-[2.25rem] leading-none tracking-[-0.02em]">{best.player.name}</p>
                          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ash">
                            {best.player.position} · {best.player.team} · bye {best.player.byeWeek} · {best.player.rosteredPct}% rostered
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="tnum font-display text-[3.5rem] leading-none tracking-[-0.03em]">{best.confidence}</p>
                          <Caption className="mt-2">Confidence</Caption>
                        </div>
                      </div>
                      <p className="mt-6 text-[17px] leading-[1.5] text-ink">{best.headline}</p>
                      <ul className="mt-4 space-y-2">
                        {best.reasons.slice(0, 2).map((reason) => (
                          <li key={reason} className="flex gap-3 text-[14px] leading-[1.6] text-ink/75">
                            <span className="mt-[0.7em] h-px w-4 shrink-0 bg-ink" />
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink/10 pt-4">
                        <Caption className="text-ink">{PRIORITY_LABEL[best.priority]}</Caption>
                        <Caption>
                          {best.projectedWeeklySwing >= 0 ? "+" : ""}
                          {best.projectedWeeklySwing.toFixed(1)} pts / wk
                        </Caption>
                        {best.counterpart && (
                          <Caption>
                            {best.counterpart.label}: <span className="text-ink">{best.counterpart.name}</span> ({best.counterpart.position}, {best.counterpart.team})
                          </Caption>
                        )}
                        {best.tags.length > 0 && <Caption>{best.tags.join(" · ")}</Caption>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[15px] leading-[1.6] text-ink/60">No candidate clears the confidence bar this week.</p>
                  )}
                </div>
              </div>
            </Reveal>
          </li>
        );
      })}
    </ol>
  );
}
