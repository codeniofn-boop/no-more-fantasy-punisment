import Link from "next/link";

import { Caption, Container, Eyebrow } from "@/components/landing/Editorial";
import { PLAYER_UNIVERSE } from "@/data/players";
import { NFL_TEAMS, SEASON_WEEKS } from "@/data/teams";

const COLUMNS: Array<{ heading: string; links: Array<{ label: string; href: string }> }> = [
  {
    heading: "Product",
    links: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Platform", href: "#platform" },
      { label: "Action lanes", href: "#lanes" },
      { label: "Matchup outlook", href: "#outlook" },
    ],
  },
  {
    heading: "Engine",
    links: [
      { label: "Scoring model", href: "#engine" },
      { label: "Roster intake", href: "#intake" },
      { label: "Specifications", href: "#specifications" },
    ],
  },
  {
    heading: "Interfaces",
    links: [
      { label: "POST /api/analyze", href: "#intake" },
      { label: "GET /api/league/{provider}/{id}", href: "#intake" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/15">
      <Container className="py-20">
        <div className="grid grid-cols-12 gap-x-6 gap-y-14">
          <div className="col-span-12 lg:col-span-6">
            <p className="font-display text-[clamp(3rem,6vw,6rem)] leading-[0.95] tracking-[-0.03em]">FantasyShield</p>
            <p className="mt-6 max-w-[40ch] text-[15px] leading-[1.6] text-ink/70">
              Automated, high-precision roster optimization. Deterministic scoring, explicit instructions, every decision explained.
            </p>
          </div>
          {COLUMNS.map((column) => (
            <div key={column.heading} className="col-span-6 md:col-span-4 lg:col-span-2">
              <Eyebrow className="text-ash">{column.heading}</Eyebrow>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link href={link.href} className="text-[14px] text-ink/80 transition-colors hover:text-ink">
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className="text-[14px] text-ink/80 transition-colors hover:text-ink">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-20 flex flex-col gap-3 border-t border-ink/15 pt-6 md:flex-row md:items-center md:justify-between">
          <Caption>FantasyShield · Engine v1 · {NFL_TEAMS.length} franchises · {SEASON_WEEKS}-week schedule · {PLAYER_UNIVERSE.length} fictional athletes</Caption>
          <Caption>Built on Next.js, TypeScript and Tailwind CSS. No external data services.</Caption>
        </div>
      </Container>
    </footer>
  );
}
