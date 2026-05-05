"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SOURCES, type CompareResult, type SourceKey, type LineSplit } from "@/lib/types";
import { Navigation } from "@/components/Navigation";
import { CompareTable } from "@/components/CompareTable";

export default function Home() {
  const [sourceKey, setSourceKey] = useState<SourceKey>("SGGS");
  const [pageNo, setPageNo] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diffsOnly, setDiffsOnly] = useState(false);
  const [lineOffset, setLineOffset] = useState(0);
  const [splits, setSplits] = useState<LineSplit[]>([]);
  const [skipSearching, setSkipSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchComparison = useCallback(
    async (source: SourceKey, page: number, offset = 0): Promise<CompareResult | null> => {
      const res = await fetch(`/api/compare?source=${source}&page=${page}&offset=${offset}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      return (await res.json()) as CompareResult;
    },
    []
  );

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const data = await fetchComparison(sourceKey, pageNo, lineOffset);
        if (alive && data) {
          setResult(data);
          setError(null);
        }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (alive) setLoading(false);
      }
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    run();
    return () => { alive = false; };
  }, [sourceKey, pageNo, lineOffset, fetchComparison]);

  // Keyboard navigation (skip focus when inside inputs)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      const maxPage = SOURCES[sourceKey].maxPage;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setLineOffset(0);
        setSplits([]);
        setPageNo((p) => { const n = Math.min(p + 1, maxPage); setPageInput(String(n)); return n; });
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setLineOffset(0);
        setSplits([]);
        setPageNo((p) => { const n = Math.max(p - 1, 1); setPageInput(String(n)); return n; });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [sourceKey]);

  const handleSourceChange = (newSource: SourceKey) => {
    setSourceKey(newSource);
    setPageNo(1);
    setPageInput("1");
    setLineOffset(0);
    setSplits([]);
    setResult(null);
  };

  const handlePageChange = (newPage: number) => {
    const maxPage = SOURCES[sourceKey].maxPage;
    const clamped = Math.max(1, Math.min(newPage, maxPage));
    setPageNo(clamped);
    setPageInput(String(clamped));
    setLineOffset(0);
    setSplits([]);
  };

  const handleSplit = (lineIndex: number, side: "shabados" | "banidb", wordIndex: number) => {
    setSplits((prev) => [
      ...prev.filter((s) => !(s.lineIndex === lineIndex && s.side === side)),
      { lineIndex, side, wordIndex },
    ]);
  };

  const handleRemoveSplit = (lineIndex: number, side: "shabados" | "banidb") => {
    setSplits((prev) => prev.filter((s) => !(s.lineIndex === lineIndex && s.side === side)));
  };

  const handlePageInputSubmit = () => {
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed)) handlePageChange(parsed);
  };

  // Scan forward page-by-page until a page with diffs is found
  const skipToNextDiff = useCallback(async () => {
    if (skipSearching) {
      abortRef.current?.abort();
      setSkipSearching(false);
      return;
    }
    const maxPage = SOURCES[sourceKey].maxPage;
    setSkipSearching(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let p = pageNo + 1;
    try {
      while (p <= maxPage) {
        if (ctrl.signal.aborted) break;
        const data = await fetchComparison(sourceKey, p);
        if (ctrl.signal.aborted) break;
        if (data && data.diffCount > 0) {
          setPageNo(p);
          setPageInput(String(p));
          setSplits([]);
          setResult(data);
          break;
        }
        p++;
      }
    } catch {
      // aborted or network error — silently stop
    } finally {
      setSkipSearching(false);
    }
  }, [sourceKey, pageNo, skipSearching, fetchComparison]);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="border-b border-stone-800 px-6 py-4">
        <h1 className="text-lg font-semibold text-stone-200">Gurbani Diff</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          Shabad OS vs BaniDB — click any line to expand metadata
        </p>
      </header>

      <Navigation
        sourceKey={sourceKey}
        pageNo={pageNo}
        maxPage={result?.maxPage ?? SOURCES[sourceKey].maxPage}
        diffCount={result ? result.diffCount : undefined}
        loading={loading}
        skipSearching={skipSearching}
        lineOffset={lineOffset}
        onSourceChange={handleSourceChange}
        onPageChange={handlePageChange}
        onSkipToNextDiff={skipToNextDiff}
        onOffsetChange={setLineOffset}
        pageInput={pageInput}
        onPageInputChange={setPageInput}
        onPageInputSubmit={handlePageInputSubmit}
      />

      <main>
        {error && (
          <div className="px-6 py-4 text-red-400 text-sm">Error: {error}</div>
        )}

        {loading && !result && (
          <div className="flex items-center justify-center py-24 text-stone-500">
            Loading…
          </div>
        )}

        {result && (
          <>
            <div className="px-4 py-2 border-b border-stone-800 flex items-center gap-3 text-sm">
              <label className="flex items-center gap-2 text-stone-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={diffsOnly}
                  onChange={(e) => setDiffsOnly(e.target.checked)}
                  className="accent-amber-500"
                />
                Diffs only
              </label>
              <span className="text-xs text-stone-600 ml-2">
                ← → arrow keys or click ← → to navigate
              </span>
            </div>
            <div className={loading ? "opacity-50 pointer-events-none" : ""}>
              <CompareTable
                result={result}
                diffsOnly={diffsOnly}
                splits={splits}
                onSplit={handleSplit}
                onRemoveSplit={handleRemoveSplit}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
