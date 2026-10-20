import Link from "next/link";

import { ButtonLink, Caption, Container, Eyebrow } from "@/components/landing/Editorial";
import { editorialFontClass } from "@/lib/fonts";

export default function NotFound() {
  return (
    <div className={`${editorialFontClass} editorial flex min-h-screen flex-col bg-paper text-ink`}>
      <header className="border-b border-ink/15">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="font-display text-[23px] leading-none tracking-[-0.01em]">
            FantasyShield
          </Link>
          <Caption>Error 404</Caption>
        </Container>
      </header>
      <main className="flex flex-1 items-center">
        <Container className="py-24">
          <div className="grid grid-cols-12 gap-x-6">
            <div className="col-span-12 lg:col-span-9">
              <Eyebrow className="text-ash">Page not found</Eyebrow>
              <h1 className="mt-8 font-display text-[clamp(3.5rem,9vw,9rem)] leading-[0.92] tracking-[-0.03em]">
                This page is
                <br />
                <em className="italic">off the roster.</em>
              </h1>
              <p className="mt-10 max-w-[48ch] text-[17px] leading-[1.6] text-ink/75">
                The address does not match any route. The landing page and the dashboard are both one click away.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <ButtonLink href="/">Back to the site</ButtonLink>
                <ButtonLink href="/dashboard" variant="outline">
                  Open the dashboard
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </main>
      <footer className="border-t border-ink/15">
        <Container className="py-6">
          <Caption>FantasyShield · Engine v1</Caption>
        </Container>
      </footer>
    </div>
  );
}
