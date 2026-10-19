import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";

import { LandingPage } from "@/components/landing/LandingPage";
import { buildSampleRoster } from "@/data/players";
import { analyzeRoster } from "@/utils/fantasyEngine";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FantasyShield — Roster intelligence, engineered",
  description:
    "FantasyShield scores every player on recent volume, remaining strength of schedule and injury risk, then tells you who to trade, who to trade for, who to drop and who to pick up.",
};

/** Fixed so the page prerenders identically on every build. */
const SNAPSHOT_AT = "2026-10-19T12:00:00.000Z";

export default function HomePage() {
  const roster = buildSampleRoster(SNAPSHOT_AT);
  const analysis = analyzeRoster(roster, { now: new Date(SNAPSHOT_AT) });

  return (
    <div className={`${inter.variable} ${instrumentSerif.variable} editorial min-h-screen bg-paper text-ink`}>
      <LandingPage roster={roster} analysis={analysis} />
    </div>
  );
}
