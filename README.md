# FantasyShield

> Never lose your fantasy league again. FantasyShield is a Next.js full-stack dashboard that scores every player on recent volume, remaining strength of schedule and injury-report risk, then tells you exactly **who to trade, who to trade for, who to drop and who to pick up**.

![Stack](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Run the sample roster**, and the Win Engine populates the dashboard. Everything runs locally with no external services or API keys.

| Script                  | What it does                                                    |
| ----------------------- | --------------------------------------------------------------- |
| `npm run dev`           | Development server with hot reload                              |
| `npm run build`         | Production build                                                |
| `npm run start`         | Serve the production build                                      |
| `npm run lint`          | ESLint (Next.js core-web-vitals + TypeScript rules)             |
| `npm run typecheck`     | `tsc --noEmit`                                                  |
| `npm run engine:report` | Validates the generated schedule and prints the sample analysis |

## Features

### Roster Ingestion HUD

Three ways to bring in a team, all handled by `src/utils/rosterParsers.ts`:

- **Upload a file**: drag and drop or pick a `.json` or `.csv` file. JSON accepts an array of players, an object with a `players` array, or a roster exported from FantasyShield. CSV needs a `name` column and optionally `position`, `team`, `status`, `slot` and `rostered` columns (any delimiter, quoted cells supported).
- **Paste text**: one player per line in almost any shape: `Name, POS, TEAM`, `POS Name TEAM`, `Bench: Name, RB, BUF (Q)`, `Browns D/ST`, and so on. Injury tags such as `(Q)`, `(O)` and `(IR)` are honoured.
- **League ID**: pick ESPN or Yahoo and enter an id. The mock connector (`GET /api/league/{provider}/{leagueId}`) returns a deterministic roster for that id, so the same id always produces the same team.

Players that exist in the engine database load their full usage history. Unknown players are synthesized from positional baseline usage so the engine can still score them, and the HUD tells you which ones were synthesized.

### Current Team Health Index

The sticky top bar tracks a 0-100 health index with a letter grade and four sub-indices:

- **Volume**: recency-weighted targets, carries and dropbacks for the optimal starters versus positional baselines.
- **Schedule**: remaining strength of schedule from each opponent's fantasy points allowed to the position.
- **Health**: injury-report exposure, weighted toward starters and escalated for long absences.
- **Depth**: quality of the top bench assets plus lineup-slot coverage.

### AI Action Center

A four-lane matrix, each lane ranked by confidence with explicit reasons, tags, a priority (act now / this week / monitor), a projected weekly point swing and a counterpart move:

| Lane                           | What triggers it                                                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Who to Trade (Sell High)**   | Touchdowns running well above what the player's touch volume supports, or a brutal three-week stretch of matchups     |
| **Who to Trade For (Buy Low)** | Rising snap share or opportunities, a soft remaining schedule, or unlucky touchdown totals on strong usage             |
| **Who to Drop**                | Long-term injuries, bench clutter with no path to the lineup, or kickers and defenses whose streaming window closed    |
| **Who to Pick Up**             | Trending handcuffs for hurt starters, ascending waiver-wire roles, immediate streamers with plus matchups             |

### Other views

- **Roster Intake**: the ingestion HUD plus a scored roster table (projection, volume, schedule, risk, TD ratio, composite, trend) and the engine's lineup upgrades.
- **Matchup Outlook**: a five-week heat map of opponent defensive rank versus each player's position.
- **Dashboard**: this week's playbook, the health breakdown, a compact Action Center, lineup check and bye-week watch.

The last imported roster is remembered in `localStorage` so a refresh keeps your team.

## Architecture

```
src/
  app/
    page.tsx                                  Dashboard entry (renders the client app)
    layout.tsx                                Root layout, fonts, metadata
    globals.css                               Tailwind 4 theme tokens and dark theme
    api/analyze/route.ts                      POST: normalise a roster and run the engine
    api/league/[provider]/[leagueId]/route.ts GET: deterministic mock ESPN / Yahoo import
  components/
    FantasyShieldApp.tsx                      Client root: state, persistence, view routing
    layout/Sidebar.tsx, TopStats.tsx          Navigation and the health tracker
    roster/RosterDropzone.tsx, RosterTable.tsx
    action-center/ActionCenter.tsx, ActionCard.tsx
    dashboard/DashboardView.tsx, MatchupOutlook.tsx
    ui/                                       Badges, score bars, health ring, panel
  data/
    teams.ts                                  32 teams, defense profiles, generated 18-week schedule
    players.ts                                Fictional player universe (sample roster + free-agent pool)
  utils/
    fantasyEngine.ts                          Types (Player, Roster, ActionItem, ...) and all scoring logic
    rosterParsers.ts                          JSON / CSV / text ingestion
    leagueImport.ts                           Seeded mock league builder
  lib/
    api.ts                                    Typed fetch client for the route handlers
    actionMeta.ts                             Lane metadata and shared style maps
scripts/
  engine-report.ts                            Schedule validation + sample analysis printout
```

### Simulation engine

`src/utils/fantasyEngine.ts` is pure, deterministic TypeScript with no framework imports, so the same code runs in the route handler and in the engine report script. The scoring model:

- **Volume score** = recency-weighted opportunities (weights 0.4 / 0.3 / 0.2 / 0.1 over the last four weeks) divided by a positional baseline.
- **Schedule score** = the mean "ease" of every remaining opponent, where ease maps the defense's rank versus the position (1 = toughest) onto 0-100.
- **Injury risk** = a mapping from the injury report (Healthy 0 to IR 100), escalated for each expected week missed.
- **TD sustainability** = season touchdowns divided by the touchdowns the player's opportunities would normally produce.
- **Composite** = 0.45 volume + 0.25 schedule + 0.30 health.
- **Projected points** = recency-weighted points adjusted for next opponent, bye and injury; used to build the optimal lineup.

All thresholds live in `ENGINE_CONFIG`, so tuning the engine is a one-file change.

### Data

Every athlete in `src/data/players.ts` is fictional. NFL team abbreviations are real, but their defensive profiles and the 18-week schedule are generated mock data: the schedule uses the circle method so no two teams meet twice, with bye groups chosen from each bye week's own pairings so every team sits out exactly once.
