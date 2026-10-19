"use client";

import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  Braces,
  CircleCheck,
  ClipboardPaste,
  FileSpreadsheet,
  Info,
  Link2,
  LoaderCircle,
  Sparkles,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";

import { PositionBadge, StatusBadge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";
import { ApiError, importLeagueRoster } from "@/lib/api";
import { POSITIONS, type Position, type Roster } from "@/utils/fantasyEngine";
import { LEAGUE_ID_PATTERN, LEAGUE_PROVIDERS, PROVIDER_LABELS, type LeagueProvider } from "@/utils/leagueImport";
import { detectFormat, parseRosterInput, SAMPLE_PASTE, type ParseResult } from "@/utils/rosterParsers";

type IntakeMode = "upload" | "paste" | "league";

interface RosterDropzoneProps {
  onRosterReady: (roster: Roster) => void;
  onLoadSample: () => void;
  busy: boolean;
}

const MODES: Array<{ id: IntakeMode; label: string; icon: typeof Upload; hint: string }> = [
  { id: "upload", label: "Upload file", icon: Upload, hint: ".json or .csv" },
  { id: "paste", label: "Paste text", icon: ClipboardPaste, hint: "One player per line" },
  { id: "league", label: "League ID", icon: Link2, hint: "ESPN or Yahoo" },
];

const ACCEPTED_TYPES = ".json,.csv,.tsv,.txt,application/json,text/csv,text/plain";

export function RosterDropzone({ onRosterReady, onLoadSample, busy }: RosterDropzoneProps) {
  const [mode, setMode] = useState<IntakeMode>("upload");
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [teamName, setTeamName] = useState("");
  const [leagueName, setLeagueName] = useState("");
  const [provider, setProvider] = useState<LeagueProvider>("espn");
  const [leagueId, setLeagueId] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const resetPreview = () => {
    setParseResult(null);
    setFileName(null);
  };

  const ingestText = (text: string, name?: string) => {
    const format = detectFormat(text, name);
    const result = parseRosterInput(text, format);
    setParseResult(result);
    if (result.teamName && !teamName) setTeamName(result.teamName);
    if (result.leagueName && !leagueName) setLeagueName(result.leagueName);
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    setFileName(file.name);
    ingestText(text, file.name);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
    event.target.value = "";
  };

  const confirmParsed = () => {
    if (!parseResult || parseResult.players.length === 0) return;
    onRosterReady({
      leagueName: leagueName.trim() || parseResult.leagueName || "My League",
      teamName: teamName.trim() || parseResult.teamName || "My Team",
      source: mode === "paste" ? "paste" : "upload",
      players: parseResult.players,
      importedAt: new Date().toISOString(),
    });
    resetPreview();
  };

  const runLeagueImport = async () => {
    const id = leagueId.trim();
    if (!LEAGUE_ID_PATTERN.test(id)) {
      setImportError("League id must be 3-24 characters: letters, numbers, dots, dashes or underscores.");
      return;
    }
    setImporting(true);
    setImportError(null);
    try {
      const response = await importLeagueRoster(provider, id);
      onRosterReady(response.roster);
    } catch (error) {
      setImportError(error instanceof ApiError ? error.message : "The league import failed. Check the id and try again.");
    } finally {
      setImporting(false);
    }
  };

  const switchMode = (next: IntakeMode) => {
    setMode(next);
    setImportError(null);
    resetPreview();
  };

  return (
    <Panel
      title="Roster Ingestion HUD"
      subtitle="Bring in your team three ways. Known players load real engine data; unknown players are scored from positional baselines."
      icon={Sparkles}
      action={
        <button
          type="button"
          onClick={onLoadSample}
          disabled={busy}
          className="rounded-lg border border-shield-500/40 bg-shield-500/10 px-3 py-1.5 text-xs font-semibold text-shield-300 transition hover:bg-shield-500/20 disabled:opacity-50"
        >
          Load sample roster
        </button>
      }
    >
      <div className="flex flex-wrap gap-2">
        {MODES.map((item) => {
          const Icon = item.icon;
          const active = item.id === mode;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => switchMode(item.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ring-1 transition ${
                active ? "bg-shield-500/10 text-shield-300 ring-shield-500/40" : "bg-ink-700/60 text-ink-200 ring-ink-600 hover:text-ink-100"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
              <span className="hidden text-[10px] font-normal text-ink-400 sm:inline">{item.hint}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {mode === "upload" && (
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={`grid-lines flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
              dragActive ? "border-shield-500 bg-shield-500/10" : "border-ink-500 bg-ink-900/60"
            }`}
          >
            <div className="flex items-center gap-3 text-ink-300">
              <Braces className="h-6 w-6" />
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold text-ink-100">Drag a roster file here</p>
            <p className="mt-1 max-w-md text-xs text-ink-300">
              JSON (an array of players or an exported FantasyShield roster) or CSV with name, position, team and optional status and slot columns.
            </p>
            <input ref={fileInputRef} id={inputId} type="file" accept={ACCEPTED_TYPES} className="sr-only" onChange={onFileChange} />
            <label
              htmlFor={inputId}
              className="mt-4 cursor-pointer rounded-lg bg-shield-500 px-4 py-2 text-xs font-semibold text-ink-950 transition hover:bg-shield-400"
            >
              Choose file
            </label>
            {fileName && <p className="mt-3 font-mono text-[11px] text-ink-300">{fileName}</p>}
          </div>
        )}

        {mode === "paste" && (
          <div className="space-y-3">
            <textarea
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              rows={9}
              spellCheck={false}
              placeholder={SAMPLE_PASTE}
              className="w-full rounded-xl border border-ink-600 bg-ink-900/80 p-3 font-mono text-xs text-ink-100 placeholder:text-ink-400 focus:border-shield-500/60 focus:outline-none"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => ingestText(rawText)}
                disabled={rawText.trim().length === 0}
                className="rounded-lg bg-shield-500 px-4 py-2 text-xs font-semibold text-ink-950 transition hover:bg-shield-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Parse roster
              </button>
              <button
                type="button"
                onClick={() => setRawText(SAMPLE_PASTE)}
                className="rounded-lg border border-ink-600 px-3 py-2 text-xs font-semibold text-ink-200 transition hover:text-ink-100"
              >
                Fill with example
              </button>
              <span className="flex items-center gap-1 text-[11px] text-ink-400">
                <Info className="h-3.5 w-3.5" />
                Accepts &quot;Name, POS, TEAM&quot;, &quot;POS Name TEAM&quot;, slot prefixes like &quot;Bench:&quot; and tags like (Q) or (IR).
              </span>
            </div>
          </div>
        )}

        {mode === "league" && (
          <div className="rounded-xl border border-ink-600 bg-ink-900/60 p-4">
            <div className="flex flex-wrap gap-2">
              {LEAGUE_PROVIDERS.map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  onClick={() => setProvider(candidate)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                    provider === candidate ? "bg-buy-500/10 text-buy-400 ring-buy-500/40" : "bg-ink-700/60 text-ink-200 ring-ink-600"
                  }`}
                >
                  {PROVIDER_LABELS[candidate]}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={leagueId}
                onChange={(event) => setLeagueId(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void runLeagueImport();
                }}
                placeholder={`${PROVIDER_LABELS[provider]} league id, e.g. 184522`}
                className="flex-1 rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 font-mono text-sm text-ink-100 placeholder:text-ink-400 focus:border-buy-500/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void runLeagueImport()}
                disabled={importing || busy || leagueId.trim().length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-buy-500 px-4 py-2 text-xs font-semibold text-ink-950 transition hover:bg-buy-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {importing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                Import league
              </button>
            </div>
            <p className="mt-2 text-[11px] text-ink-400">
              Mock connector: the same id always returns the same deterministic roster drawn from the engine database.
            </p>
            {importError && (
              <p className="mt-3 flex items-center gap-2 text-xs text-drop-300">
                <TriangleAlert className="h-4 w-4" />
                {importError}
              </p>
            )}
          </div>
        )}
      </div>

      {parseResult && (
        <ParsePreview
          result={parseResult}
          teamName={teamName}
          leagueName={leagueName}
          onTeamName={setTeamName}
          onLeagueName={setLeagueName}
          onConfirm={confirmParsed}
          onDismiss={resetPreview}
          busy={busy}
        />
      )}
    </Panel>
  );
}

interface ParsePreviewProps {
  result: ParseResult;
  teamName: string;
  leagueName: string;
  onTeamName: (value: string) => void;
  onLeagueName: (value: string) => void;
  onConfirm: () => void;
  onDismiss: () => void;
  busy: boolean;
}

function ParsePreview({ result, teamName, leagueName, onTeamName, onLeagueName, onConfirm, onDismiss, busy }: ParsePreviewProps) {
  const counts = POSITIONS.map((position) => ({
    position,
    count: result.players.filter((player) => player.position === position).length,
  })).filter((entry) => entry.count > 0);

  return (
    <div className="mt-5 rounded-xl border border-ink-600 bg-ink-900/70 p-4 animate-rise">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-ink-100">
            {result.players.length > 0 ? <CircleCheck className="h-4 w-4 text-shield-400" /> : <TriangleAlert className="h-4 w-4 text-drop-400" />}
            Parsed {result.players.length} player{result.players.length === 1 ? "" : "s"} from {result.format.toUpperCase()}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {counts.map((entry) => (
              <span key={entry.position} className="flex items-center gap-1 rounded-md bg-ink-700 px-1.5 py-0.5 text-[11px] text-ink-200 ring-1 ring-ink-600">
                <PositionBadge position={entry.position as Position} className="h-5 min-w-7 text-[10px]" />
                <span className="font-mono">{entry.count}</span>
              </span>
            ))}
          </div>
        </div>
        <button type="button" onClick={onDismiss} className="rounded-lg p-1.5 text-ink-300 hover:bg-ink-700 hover:text-ink-100" aria-label="Discard parsed roster">
          <X className="h-4 w-4" />
        </button>
      </div>

      {result.errors.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-lg border border-drop-500/30 bg-drop-500/10 p-3 text-xs text-drop-300">
          {result.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      {result.warnings.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-lg border border-sell-500/30 bg-sell-500/10 p-3 text-xs text-sell-400">
          {result.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}

      {result.players.length > 0 && (
        <>
          <ul className="mt-3 grid max-h-64 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
            {result.players.map((player) => (
              <li key={player.id} className="flex items-center gap-2 rounded-lg bg-ink-800/80 px-2.5 py-1.5 text-xs">
                <PositionBadge position={player.position} />
                <span className="min-w-0 flex-1 truncate font-medium text-ink-100">{player.name}</span>
                <span className="font-mono text-[11px] text-ink-300">{player.team}</span>
                {player.injury.status !== "Healthy" && <StatusBadge status={player.injury.status} />}
                <span className="rounded bg-ink-700 px-1.5 py-0.5 font-mono text-[10px] text-ink-300">{player.slot === "Starter" ? "ST" : player.slot === "IR" ? "IR" : "BN"}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <input
              value={teamName}
              onChange={(event) => onTeamName(event.target.value)}
              placeholder="Team name (optional)"
              className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-400 focus:border-shield-500/60 focus:outline-none"
            />
            <input
              value={leagueName}
              onChange={(event) => onLeagueName(event.target.value)}
              placeholder="League name (optional)"
              className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-400 focus:border-shield-500/60 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-shield-500 px-4 py-2 text-xs font-semibold text-ink-950 transition hover:bg-shield-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Run the win engine on this roster
          </button>
        </>
      )}
    </div>
  );
}
