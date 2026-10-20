import Link from "next/link";

import { ButtonLink, Container } from "@/components/landing/Editorial";
import { ENGINE_CONFIG } from "@/utils/fantasyEngine";

const NAV: Array<{ label: string; href: string }> = [
  { label: "Platform", href: "#platform" },
  { label: "Engine", href: "#engine" },
  { label: "Lanes", href: "#lanes" },
  { label: "Intake", href: "#intake" },
  { label: "Outlook", href: "#outlook" },
  { label: "Specifications", href: "#specifications" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/15 bg-paper/95">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Link href="/" className="font-display text-[23px] leading-none tracking-[-0.01em]">
          FantasyShield
        </Link>
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Sections">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="t-eyebrow text-ash transition-colors hover:text-ink">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-6">
          <span className="hidden font-mono text-[11px] uppercase tracking-[0.12em] text-ash md:inline">Release 1.0 · Week {ENGINE_CONFIG.currentWeek}</span>
          <ButtonLink href="/dashboard" className="h-10 px-5">
            Open dashboard
          </ButtonLink>
        </div>
      </Container>
    </header>
  );
}
