import { Caption, Eyebrow } from "@/components/landing/Editorial";

interface Intake {
  index: string;
  title: string;
  description: string;
  snippet: string;
  footnote: string;
}

const INTAKES: Intake[] = [
  {
    index: "A",
    title: "File upload",
    description: "Drop a .json or .csv export. JSON accepts an array of players, an object with a players array, or a roster exported from the dashboard.",
    snippet: `name,position,team,status,slot
Dante Okafor,RB,SF,Healthy,Starter
Rashad Bellamy,RB,BUF,Q,Bench
Gideon Marsh,TE,PIT,IR,IR`,
    footnote: "Any delimiter · quoted cells · header optional",
  },
  {
    index: "B",
    title: "Pasted text",
    description: "One player per line in almost any shape. Slot prefixes, team names, nicknames and injury tags are all honoured.",
    snippet: `QB: Marcus Delacroix, DET
FLEX: Brennan Holloway, WR, GB
Bench: Rashad Bellamy, RB, BUF (Q)
DST: Browns D/ST`,
    footnote: "Name, POS, TEAM · POS Name TEAM · (Q) (O) (IR)",
  },
  {
    index: "C",
    title: "League id",
    description: "Enter an ESPN or Yahoo league id. The connector returns the same deterministic roster for the same id, every time.",
    snippet: `GET  /api/league/espn/184522
→ 200 · 16 players · 10 starters

POST /api/analyze
→ health index · lineup · 4 lanes`,
    footnote: "Validated ids · 400 with details on bad input",
  },
];

export function IntakeGrid() {
  return (
    <div className="grid grid-cols-1 gap-px bg-ink/15 md:grid-cols-3">
      {INTAKES.map((intake) => (
        <div key={intake.index} className="flex flex-col bg-paper p-6 xl:p-8">
          <p className="font-display text-[3rem] leading-none tracking-[-0.02em]">{intake.index}</p>
          <Eyebrow className="mt-6 text-ash">{intake.title}</Eyebrow>
          <p className="mt-4 min-h-[6rem] text-[15px] leading-[1.6] text-ink/75">{intake.description}</p>
          <pre className="mt-6 overflow-x-auto rounded-[2px] border border-ink/15 bg-[#f1f1f1] p-4 font-mono text-[11px] leading-[1.8] text-ink">
            {intake.snippet}
          </pre>
          <Caption className="mt-4">{intake.footnote}</Caption>
        </div>
      ))}
    </div>
  );
}
