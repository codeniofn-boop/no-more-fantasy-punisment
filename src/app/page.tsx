import type { Metadata } from "next";

import { LandingPage } from "@/components/landing/LandingPage";
import { buildSampleRoster } from "@/data/players";
import { editorialFontClass } from "@/lib/fonts";
import { analyzeRoster } from "@/utils/fantasyEngine";

const TITLE = "FantasyShield — Roster intelligence, engineered";
const DESCRIPTION =
  "FantasyShield scores every player on recent volume, remaining strength of schedule and injury risk, then tells you who to trade, who to trade for, who to drop and who to pick up.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    siteName: "FantasyShield",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

/** Fixed so the page prerenders identically on every build. */
const SNAPSHOT_AT = "2026-10-19T12:00:00.000Z";

export default function HomePage() {
  const roster = buildSampleRoster(SNAPSHOT_AT);
  const analysis = analyzeRoster(roster, { now: new Date(SNAPSHOT_AT) });

  return (
    <div className={`${editorialFontClass} editorial min-h-screen bg-paper text-ink`}>
      <LandingPage roster={roster} analysis={analysis} />
    </div>
  );
}
