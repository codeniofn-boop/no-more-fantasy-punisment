import { ButtonLink, Caption, Container, Eyebrow, Section, Stat } from "@/components/landing/Editorial";
import { EngineBand } from "@/components/landing/EngineBand";
import { IntakeGrid } from "@/components/landing/IntakeGrid";
import { LaneList } from "@/components/landing/LaneList";
import { MatchupGrid } from "@/components/landing/MatchupGrid";
import { Plate } from "@/components/landing/Plate";
import { Reveal } from "@/components/landing/Reveal";
import { ScoreTable } from "@/components/landing/ScoreTable";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { SpecTable } from "@/components/landing/SpecTable";
import { PLAYER_UNIVERSE } from "@/data/players";
import { NFL_TEAMS, SEASON_WEEKS } from "@/data/teams";
import { ACTION_ORDER } from "@/lib/actionMeta";
import { buildRosterRows } from "@/lib/rosterRows";
import { ENGINE_CONFIG, type Roster, type RosterAnalysis } from "@/utils/fantasyEngine";

interface LandingPageProps {
  roster: Roster;
  analysis: RosterAnalysis;
}

function Hero({ roster, analysis }: LandingPageProps) {
  const urgent = analysis.actions.filter((item) => item.priority === 1).length;
  return (
    <section className="pt-16 md:pt-24 xl:pt-28">
      <Container>
        <div className="grid grid-cols-12 gap-x-6 gap-y-14">
          <div className="col-span-12 lg:col-span-7">
            <Eyebrow className="text-balance text-ash">Roster intelligence platform · Release 1.0</Eyebrow>
            <h1 className="mt-8 font-display text-[clamp(3.75rem,9.2vw,9.25rem)] leading-[0.92] tracking-[-0.03em]">
              Never lose
              <br />
              your league
              <br />
              <em className="italic">again.</em>
            </h1>
            <p className="mt-10 max-w-[48ch] text-[17px] leading-[1.6] text-ink/75 md:text-[19px]">
              FantasyShield scores every player on recent volume, remaining strength of schedule and injury-report risk, then issues four
              explicit instructions each week: who to trade, who to trade for, who to drop and who to pick up. Deterministic, explainable,
              and entirely yours.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/dashboard">Open the dashboard</ButtonLink>
              <ButtonLink href="#engine" variant="outline">
                Read the engine specification
              </ButtonLink>
            </div>
            <Caption className="mt-10">
              Week {analysis.currentWeek} · {analysis.weeksRemaining} weeks remaining · Sample snapshot: {roster.teamName}
            </Caption>
          </div>
          <div className="col-span-12 lg:col-span-5">
            <Reveal>
              <Plate index="01" variant="concrete" ratio="4/5" caption="Cast concrete cantilever, north elevation, macro" />
            </Reveal>
          </div>
        </div>
      </Container>

      <Container className="mt-20 md:mt-28">
        <div className="border-y border-ink/15 py-10">
          <div className="grid grid-cols-2 gap-y-10 md:grid-cols-3 lg:grid-cols-6">
            <Stat label="Health index" value={Math.round(analysis.health.overall)} note={`Grade ${analysis.health.grade}`} />
            <Stat label="Volume" value={Math.round(analysis.health.volume)} note="Starters, recency weighted" />
            <Stat label="Schedule" value={Math.round(analysis.health.schedule)} note="Remaining strength" />
            <Stat label="Health" value={Math.round(analysis.health.injury)} note="Injury exposure" />
            <Stat label="Moves issued" value={analysis.actions.length} note={`${urgent} marked act now`} />
            <Stat label="Players scored" value={roster.players.length} note={`${analysis.lineup.starters.length} optimal starters`} />
          </div>
        </div>
      </Container>
    </section>
  );
}

function NumbersBand() {
  return (
    <section className="border-t border-ink/15">
      <Container className="py-20 md:py-24">
        <Eyebrow className="text-ash">Platform in numbers</Eyebrow>
        <div className="mt-10 grid grid-cols-2 gap-y-12 md:grid-cols-3 lg:grid-cols-6">
          <Stat size="lg" label="Franchises" value={NFL_TEAMS.length} note="Defense profiles by position" />
          <Stat size="lg" label="Weeks" value={SEASON_WEEKS} note="Generated schedule, one bye each" />
          <Stat size="lg" label="Lanes" value={ACTION_ORDER.length} note="Trade, trade for, drop, pick up" />
          <Stat size="lg" label="Athletes" value={PLAYER_UNIVERSE.length} note="Fictional universe, tracked usage" />
          <Stat size="lg" label="Lineup slots" value={ENGINE_CONFIG.lineupSlots.length} note="QB to DST, one flex" />
          <Stat size="lg" label="Dependencies" value={0} note="No external data services" />
        </div>
      </Container>
    </section>
  );
}

function HealthTiles({ analysis }: { analysis: RosterAnalysis }) {
  const tiles = [
    { label: "Volume", value: analysis.health.volume, definition: "Recency-weighted targets, carries and dropbacks for the optimal starters." },
    { label: "Schedule", value: analysis.health.schedule, definition: "Mean ease of every remaining opponent for the optimal starters." },
    { label: "Health", value: analysis.health.injury, definition: "Injury-report exposure, weighted toward starters." },
    { label: "Depth", value: analysis.health.depth, definition: "Quality of the top bench assets plus lineup-slot coverage." },
  ];
  return (
    <div className="grid grid-cols-1 gap-px bg-ink/15 md:grid-cols-2 xl:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="bg-paper p-8">
          <Eyebrow className="text-ash">{tile.label}</Eyebrow>
          <p className="tnum mt-5 font-display text-[4rem] leading-none tracking-[-0.03em]">{Math.round(tile.value)}</p>
          <div className="mt-5 h-[2px] w-full bg-mist">
            <div className="h-full bg-ink" style={{ width: `${Math.min(100, Math.max(0, tile.value))}%` }} />
          </div>
          <p className="mt-5 text-[14px] leading-[1.6] text-ink/70">{tile.definition}</p>
        </div>
      ))}
    </div>
  );
}

function ClosingCall() {
  return (
    <section className="border-t border-ink/15">
      <Container className="py-28 md:py-36">
        <div className="grid grid-cols-12 gap-x-6 gap-y-12">
          <div className="col-span-12 lg:col-span-8">
            <h2 className="font-display text-[clamp(3rem,7vw,7rem)] leading-[0.95] tracking-[-0.03em]">
              Run the
              <br />
              sample roster.
            </h2>
            <p className="mt-8 max-w-[52ch] text-[17px] leading-[1.6] text-ink/75">
              Sixteen fictional players, one deterministic engine, every decision explained. Import your own roster when you are ready.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="/dashboard">Open the dashboard</ButtonLink>
              <ButtonLink href="#intake" variant="outline">
                Intake formats
              </ButtonLink>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-4">
            <Reveal>
              <Plate index="04" variant="plaster" ratio="1/1" caption="Lime plaster, raking light, detail" />
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}

export function LandingPage({ roster, analysis }: LandingPageProps) {
  const rows = buildRosterRows(roster, analysis);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-[2px] focus:bg-ink focus:px-4 focus:py-2 focus:text-[12px] focus:font-medium focus:uppercase focus:tracking-[0.16em] focus:text-paper"
      >
        Skip to content
      </a>
      <div className="editorial-progress" aria-hidden="true" />
      <SiteHeader />
      <main id="main">
        <Hero roster={roster} analysis={analysis} />
        <NumbersBand />

        <Section
          id="platform"
          index="01"
          label="Platform"
          title="One index for the entire roster."
          lede="The Team Health Index condenses four sub-indices into a single 0 to 100 score with a letter grade. Each one is computed from the engine’s optimal lineup, not from whoever happens to be flagged as a starter."
        >
          <Reveal>
            <HealthTiles analysis={analysis} />
          </Reveal>
          <div className="mt-20">
            <Reveal>
              <ScoreTable rows={rows} week={analysis.currentWeek} />
            </Reveal>
          </div>
          <div className="mt-20 grid grid-cols-12 gap-x-6 gap-y-10">
            <div className="col-span-12 md:col-span-6">
              <Reveal>
                <Plate index="02" variant="louver" ratio="3/2" caption="Corrugated facade, late afternoon" />
              </Reveal>
            </div>
            <div className="col-span-12 md:col-span-5 md:col-start-8">
              <Eyebrow className="text-ash">Live output</Eyebrow>
              <p className="mt-5 max-w-[36ch] text-[15px] leading-[1.6] text-ink/75">
                Every number on this page is live engine output for the sample roster, rendered when the page is built. The dashboard
                recomputes it for your roster on every import.
              </p>
              <Eyebrow className="mt-10 text-ash">Lineup</Eyebrow>
              <p className="mt-5 max-w-[36ch] text-[15px] leading-[1.6] text-ink/75">
                Starters are chosen by projected points, which fold the next opponent, the bye and the injury report into the recency-weighted
                average. Asset value and this-week value are kept apart on purpose.
              </p>
            </div>
          </div>
        </Section>

        <EngineBand />

        <Section
          id="lanes"
          index="03"
          label="Action lanes"
          title="Four instructions, ranked by confidence."
          lede="Every item carries its reasons, its tags, a priority and a counterpart move: the player to offer in return, the drop that makes room, the pickup that replaces a cut. Nothing is a black box."
        >
          <LaneList analysis={analysis} />
          <div className="mt-20 grid grid-cols-12 gap-x-6">
            <div className="col-span-12 md:col-span-7">
              <Reveal>
                <Plate index="03" variant="steel" ratio="21/9" caption="Brushed stainless, grain parallel to the light" />
              </Reveal>
            </div>
            <div className="col-span-12 mt-10 md:col-span-5 md:mt-0 md:pl-8">
              <Eyebrow className="text-ash">Priority</Eyebrow>
              <p className="mt-5 text-[15px] leading-[1.6] text-ink/75">
                Confidence at or above 75 is marked act now, 55 to 74 is this week, anything below is monitor. Each lane is capped at six
                candidates so the matrix stays decisive.
              </p>
              <Eyebrow className="mt-10 text-ash">Counterparts</Eyebrow>
              <p className="mt-5 text-[15px] leading-[1.6] text-ink/75">
                Sell-high and buy-low items are paired by asset value. Drops and pickups are paired in rank order, so every pickup names the
                roster spot it should take.
              </p>
            </div>
          </div>
        </Section>

        <Section
          id="intake"
          index="04"
          label="Intake"
          title="Bring the roster in any form."
          lede="Known players load their full usage history. Unknown players are synthesized from positional baselines, and the intake HUD tells you exactly which ones, with every warning listed."
        >
          <Reveal>
            <IntakeGrid />
          </Reveal>
        </Section>

        <Section
          id="outlook"
          index="05"
          label="Outlook"
          title="Five weeks of matchups, at a glance."
          lede="Opponent defensive rank against each player’s position. Dark cells are top-eight defenses, light cells are the softest nine, and the remaining-schedule score runs through week eighteen."
        >
          <Reveal>
            <MatchupGrid rows={rows} currentWeek={analysis.currentWeek} />
          </Reveal>
        </Section>

        <Section id="specifications" index="06" label="Specifications" title="Specifications." lede="What the platform is made of, and what it refuses to depend on.">
          <Reveal>
            <SpecTable />
          </Reveal>
        </Section>

        <ClosingCall />
      </main>
      <SiteFooter />
    </>
  );
}
