import Link from "next/link";
import type { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1440px] px-6 md:px-10 xl:px-14 ${className}`}>{children}</div>;
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`t-eyebrow ${className}`}>{children}</p>;
}

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: "solid" | "outline" | "paper" | "outline-paper";
  className?: string;
}

export function ButtonLink({ href, children, variant = "solid", className = "" }: ButtonLinkProps) {
  const base =
    "inline-flex h-12 items-center justify-center gap-3 rounded-[2px] px-6 text-[12px] font-medium uppercase tracking-[0.16em] transition-colors duration-200";
  const variants: Record<NonNullable<ButtonLinkProps["variant"]>, string> = {
    solid: "bg-ink text-paper hover:bg-[#2b2b2b]",
    outline: "border border-ink/25 text-ink hover:border-ink",
    paper: "bg-paper text-ink hover:bg-[#e9e9e9]",
    "outline-paper": "border border-paper/30 text-paper hover:border-paper",
  };
  const classes = `${base} ${variants[variant]} ${className}`;
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={classes}>
      {children}
    </a>
  );
}

interface SectionProps {
  id: string;
  index: string;
  label: string;
  title: ReactNode;
  lede?: ReactNode;
  children: ReactNode;
  dark?: boolean;
}

export function Section({ id, index, label, title, lede, children, dark = false }: SectionProps) {
  const muted = dark ? "text-paper/60" : "text-ash";
  const body = dark ? "text-paper/75" : "text-ink/75";
  return (
    <section id={id} className={`border-t ${dark ? "border-paper/15 bg-graphite text-paper" : "border-ink/15"}`}>
      <Container className="py-24 md:py-32 xl:py-40">
        <div className="grid grid-cols-12 gap-x-6 gap-y-12">
          <div className="col-span-12 lg:col-span-3">
            <div className="lg:sticky lg:top-28">
              <p className="font-display text-[3rem] leading-none tracking-[-0.02em]">{index}</p>
              <Eyebrow className={`mt-3 ${muted}`}>{label}</Eyebrow>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-9">
            <h2 className="max-w-[16ch] font-display text-[clamp(2.5rem,4.8vw,4.75rem)] leading-[0.98] tracking-[-0.02em]">{title}</h2>
            {lede && <p className={`mt-8 max-w-[60ch] text-[17px] leading-[1.6] ${body}`}>{lede}</p>}
            <div className="mt-16">{children}</div>
          </div>
        </div>
      </Container>
    </section>
  );
}

interface StatProps {
  label: string;
  value: ReactNode;
  note?: string;
  dark?: boolean;
  size?: "md" | "lg";
}

export function Stat({ label, value, note, dark = false, size = "md" }: StatProps) {
  return (
    <div className={`border-l ${dark ? "border-paper/20" : "border-ink/15"} pl-5`}>
      <Eyebrow className={dark ? "text-paper/60" : "text-ash"}>{label}</Eyebrow>
      <p className={`tnum mt-4 font-display leading-none tracking-[-0.02em] ${size === "lg" ? "text-[4.5rem]" : "text-[3.25rem]"}`}>{value}</p>
      {note && <p className={`mt-3 font-mono text-[11px] uppercase tracking-[0.12em] ${dark ? "text-paper/55" : "text-ash"}`}>{note}</p>}
    </div>
  );
}

export function Caption({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`font-mono text-[11px] uppercase tracking-[0.12em] text-ash ${className}`}>{children}</p>;
}
