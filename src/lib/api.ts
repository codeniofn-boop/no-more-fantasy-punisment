/**
 * Typed client for the FantasyShield route handlers.
 */

import type { Roster, RosterAnalysis } from "@/utils/fantasyEngine";
import type { LeagueProvider } from "@/utils/leagueImport";

export class ApiError extends Error {
  readonly status: number;
  readonly details: string[];

  constructor(message: string, status: number, details: string[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export interface AnalyzeResponse {
  roster: Roster;
  analysis: RosterAnalysis;
  warnings: string[];
}

export interface LeagueImportResponse {
  roster: Roster;
}

interface ErrorBody {
  error: string;
  details?: string[];
}

async function readError(response: Response): Promise<ApiError> {
  let body: ErrorBody | null = null;
  try {
    body = (await response.json()) as ErrorBody;
  } catch {
    body = null;
  }
  return new ApiError(body?.error ?? `Request failed with status ${response.status}`, response.status, body?.details ?? []);
}

export async function analyzeRosterRequest(roster: Roster, signal?: AbortSignal): Promise<AnalyzeResponse> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roster }),
    signal,
  });
  if (!response.ok) throw await readError(response);
  return (await response.json()) as AnalyzeResponse;
}

export async function importLeagueRoster(provider: LeagueProvider, leagueId: string, signal?: AbortSignal): Promise<LeagueImportResponse> {
  const response = await fetch(`/api/league/${encodeURIComponent(provider)}/${encodeURIComponent(leagueId)}`, { signal });
  if (!response.ok) throw await readError(response);
  return (await response.json()) as LeagueImportResponse;
}
