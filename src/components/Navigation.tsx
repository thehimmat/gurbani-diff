"use client";

import { SOURCES, type SourceKey } from "@/lib/types";

type Props = {
  sourceKey: SourceKey;
  pageNo: number;
  maxPage: number;
  diffCount: number | undefined;
  loading: boolean;
  skipSearching: boolean;
  lineOffset: number;
  onSourceChange: (s: SourceKey) => void;
  onPageChange: (p: number) => void;
  onSkipToNextDiff: () => void;
  onOffsetChange: (offset: number) => void;
  pageInput: string;
  onPageInputChange: (v: string) => void;
  onPageInputSubmit: () => void;
};

export function Navigation({
  sourceKey,
  pageNo,
  maxPage,
  diffCount,
  loading,
  skipSearching,
  lineOffset,
  onSourceChange,
  onPageChange,
  onSkipToNextDiff,
  onOffsetChange,
  pageInput,
  onPageInputChange,
  onPageInputSubmit,
}: Props) {
  const source = SOURCES[sourceKey];

  return (
    <div className="sticky top-0 z-10 bg-stone-950 border-b border-stone-800 px-4 py-3 flex flex-wrap items-center gap-3">
      {/* Source selector */}
      <select
        value={sourceKey}
        onChange={(e) => onSourceChange(e.target.value as SourceKey)}
        className="bg-stone-800 text-stone-100 rounded px-3 py-1.5 text-sm border border-stone-700 focus:outline-none focus:border-amber-500"
      >
        {Object.entries(SOURCES).map(([key, cfg]) => (
          <option key={key} value={key}>
            {cfg.label}
          </option>
        ))}
      </select>

      {/* Prev button */}
      <button
        onClick={() => onPageChange(pageNo - 1)}
        disabled={pageNo <= 1 || loading}
        className="px-3 py-1.5 text-sm rounded bg-stone-800 text-stone-100 border border-stone-700 disabled:opacity-40 hover:bg-stone-700 transition-colors"
      >
        ←
      </button>

      {/* Page input */}
      <div className="flex items-center gap-1.5">
        <span className="text-stone-400 text-sm">{source.unit}</span>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onPageInputSubmit();
          }}
          className="flex items-center gap-1"
        >
          <input
            type="number"
            min={1}
            max={maxPage}
            value={pageInput}
            onChange={(e) => onPageInputChange(e.target.value)}
            className="w-20 bg-stone-800 text-stone-100 rounded px-2 py-1.5 text-sm border border-stone-700 focus:outline-none focus:border-amber-500 text-center"
          />
          <button
            type="submit"
            className="px-2 py-1.5 text-sm rounded bg-stone-800 text-stone-400 border border-stone-700 hover:bg-stone-700"
          >
            Go
          </button>
        </form>
        <span className="text-stone-500 text-sm">/ {maxPage}</span>
      </div>

      {/* Next button */}
      <button
        onClick={() => onPageChange(pageNo + 1)}
        disabled={pageNo >= maxPage || loading}
        className="px-3 py-1.5 text-sm rounded bg-stone-800 text-stone-100 border border-stone-700 disabled:opacity-40 hover:bg-stone-700 transition-colors"
      >
        →
      </button>

      {/* Skip to next diff */}
      <button
        onClick={onSkipToNextDiff}
        disabled={loading && !skipSearching}
        title="Scan forward until a page with differences is found"
        className={`px-3 py-1.5 text-sm rounded border transition-colors ${
          skipSearching
            ? "bg-amber-900/40 text-amber-300 border-amber-700 hover:bg-amber-900/60"
            : "bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700 hover:text-stone-200"
        }`}
      >
        {skipSearching ? "⏹ stop" : "⚡ next diff"}
      </button>

      {/* Line alignment offset */}
      <div
        className="flex items-center gap-1 text-sm border border-stone-700 rounded overflow-hidden"
        title="Shift BaniDB lines relative to Shabad OS — positive skips BaniDB lines, negative skips Shabad OS lines"
      >
        <span className="px-2 text-stone-500 bg-stone-900 border-r border-stone-700 select-none">
          align
        </span>
        <button
          onClick={() => onOffsetChange(lineOffset - 1)}
          className="px-2 py-1.5 bg-stone-800 text-stone-300 hover:bg-stone-700 transition-colors"
        >
          −
        </button>
        <button
          onClick={() => onOffsetChange(0)}
          className={`px-2 py-1 min-w-[2rem] text-center transition-colors ${
            lineOffset !== 0
              ? "text-amber-300 bg-amber-900/40 hover:bg-amber-900/60"
              : "text-stone-400 bg-stone-800 hover:bg-stone-700"
          }`}
        >
          {lineOffset > 0 ? `+${lineOffset}` : lineOffset}
        </button>
        <button
          onClick={() => onOffsetChange(lineOffset + 1)}
          className="px-2 py-1.5 bg-stone-800 text-stone-300 hover:bg-stone-700 transition-colors"
        >
          +
        </button>
      </div>

      {/* Diff count badge */}
      {!loading && diffCount !== undefined && (
        <span
          className={`ml-auto text-sm px-2.5 py-1 rounded-full font-medium ${
            diffCount > 0
              ? "bg-amber-900/60 text-amber-300 border border-amber-700"
              : "bg-emerald-900/60 text-emerald-300 border border-emerald-700"
          }`}
        >
          {diffCount === 0 ? "✓ identical" : `${diffCount} diff${diffCount !== 1 ? "s" : ""}`}
        </span>
      )}

      {(loading || skipSearching) && (
        <span className="ml-auto text-sm text-stone-400 animate-pulse">
          {skipSearching ? `scanning p.${pageNo}…` : "loading…"}
        </span>
      )}
    </div>
  );
}
