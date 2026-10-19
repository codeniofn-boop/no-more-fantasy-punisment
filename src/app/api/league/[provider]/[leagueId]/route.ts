import { NextResponse } from "next/server";

import { buildLeagueRoster, isLeagueProvider, LEAGUE_ID_PATTERN, LEAGUE_PROVIDERS } from "@/utils/leagueImport";

interface RouteParams {
  params: Promise<{ provider: string; leagueId: string }>;
}

/**
 * GET /api/league/{espn|yahoo}/{leagueId}
 * Returns a deterministic mock roster for the league id.
 */
export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  const { provider, leagueId } = await params;
  const normalizedProvider = provider.toLowerCase();

  if (!isLeagueProvider(normalizedProvider)) {
    return NextResponse.json(
      { error: `Unknown provider "${provider}". Supported providers: ${LEAGUE_PROVIDERS.join(", ")}.` },
      { status: 400 },
    );
  }
  if (!LEAGUE_ID_PATTERN.test(leagueId)) {
    return NextResponse.json(
      { error: "League id must be 3-24 characters: letters, numbers, dots, dashes or underscores." },
      { status: 400 },
    );
  }

  const roster = buildLeagueRoster(normalizedProvider, leagueId, new Date().toISOString());
  return NextResponse.json({ roster });
}
