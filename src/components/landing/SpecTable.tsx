import { Caption } from "@/components/landing/Editorial";
import { PLAYER_UNIVERSE } from "@/data/players";
import { BYE_WEEK_END, BYE_WEEK_START, NFL_TEAMS, SEASON_WEEKS } from "@/data/teams";
import { ENGINE_CONFIG } from "@/utils/fantasyEngine";

interface SpecRow {
  label: string;
  value: string;
  mono?: boolean;
}

export function SpecTable() {
  const rows: SpecRow[] = [
    { label: "Framework", value: "Next.js 16, App Router, Cache Components, static shell with on-demand route handlers" },
    { label: "Language", value: "TypeScript 5 in strict mode, end to end" },
    { label: "Styling", value: "Tailwind CSS 4 with design tokens, 2px radii, hairline rules" },
    { label: "Engine", value: "Deterministic, pure TypeScript, no I/O, no randomness, identical output in server, browser and script" },
    { label: "Lineup", value: ENGINE_CONFIG.lineupSlots.join(" · "), mono: true },
    { label: "Recency weights", value: ENGINE_CONFIG.recencyWeights.map((weight) => weight.toFixed(2)).join(" · "), mono: true },
    { label: "Routes", value: "POST /api/analyze · GET /api/league/[provider]/[leagueId]", mono: true },
    {
      label: "Schedule",
      value: `${NFL_TEAMS.length} franchises · ${SEASON_WEEKS} weeks · circle-method pairings, no repeat matchups · byes in weeks ${BYE_WEEK_START} to ${BYE_WEEK_END}`,
    },
    { label: "Universe", value: `${PLAYER_UNIVERSE.length} fictional athletes with four weeks of tracked usage each` },
    { label: "Intake", value: "JSON · CSV · free text · league id, with name matching and baseline synthesis for unknown players" },
    { label: "Persistence", value: "Browser localStorage for the last roster; exportable as JSON; no accounts, no tracking" },
    { label: "Verification", value: "Type check, lint, production build, schedule validation script, browser walkthrough" },
  ];

  return (
    <figure>
      <dl className="border-t border-ink/40">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-12 gap-x-6 border-b border-ink/10 py-5">
            <dt className="col-span-12 md:col-span-3">
              <Caption className="text-ink">{row.label}</Caption>
            </dt>
            <dd className={`col-span-12 md:col-span-9 ${row.mono ? "font-mono text-[13px] text-ink" : "text-[15px] leading-[1.6] text-ink/80"}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
      <Caption className="mt-5">Table 03 — Platform specification, release 1.0</Caption>
    </figure>
  );
}
