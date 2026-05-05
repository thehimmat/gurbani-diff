import type { CompareLine, LineSplit, DiffToken, ShabadosLineData, BanidbVerseData } from "./types";
import { diffRaw, tokenize } from "./diff";

export type RenderedLine = {
  shabados: ShabadosLineData | null;
  banidb: BanidbVerseData | null;
  hasDiff: boolean;
  shabadosDiff: DiffToken[];
  banidbDiff: DiffToken[];
  renderKey: string;
  isSplitFragment: boolean;
  // Whether the ✂ button should appear on each side's cell
  canSplitShabados: boolean;
  canSplitBanidb: boolean;
  // Original CompareLine index for each side (used by CompareTable callbacks)
  sosOriginalIndex: number | null;
  bdbOriginalIndex: number | null;
  // Which split produced the fragment in this row (for the ↩ unsplit button)
  splitSource: { lineIndex: number; side: "shabados" | "banidb" } | null;
};

type SosEntry = {
  data: ShabadosLineData | null;
  originalIndex: number | null;
  isSplitFragment: boolean; // true = this is the second part of a split
};

type BdbEntry = {
  data: BanidbVerseData | null;
  originalIndex: number | null;
  isSplitFragment: boolean;
};

function splitText(text: string, wordIndex: number): [string, string] {
  const words = tokenize(text);
  const clamped = Math.max(0, Math.min(wordIndex, words.length - 2));
  return [words.slice(0, clamped + 1).join(" "), words.slice(clamped + 1).join(" ")];
}

function equalTokens(text: string): DiffToken[] {
  return tokenize(text).map((word) => ({ text: word, type: "equal" as const }));
}

export function applyLineSplits(
  lines: CompareLine[],
  splits: LineSplit[]
): RenderedLine[] {
  if (splits.length === 0) {
    return lines.map((l) => ({
      shabados: l.shabados,
      banidb: l.banidb,
      hasDiff: l.hasDiff,
      shabadosDiff: l.shabadosDiff,
      banidbDiff: l.banidbDiff,
      renderKey: String(l.index),
      isSplitFragment: false,
      canSplitShabados: true,
      canSplitBanidb: true,
      sosOriginalIndex: l.index,
      bdbOriginalIndex: l.index,
      splitSource: null,
    }));
  }

  const sosSplitMap = new Map<number, LineSplit>();
  const bdbSplitMap = new Map<number, LineSplit>();
  for (const s of splits) {
    if (s.side === "shabados") sosSplitMap.set(s.lineIndex, s);
    else bdbSplitMap.set(s.lineIndex, s);
  }

  // Expand each side independently into a flat array, then re-pair by position.
  // A split on side X inserts a second entry at the split position; the other
  // side's entries are untouched, so they naturally shift to align.
  const sosExpanded: SosEntry[] = [];
  for (const line of lines) {
    const split = sosSplitMap.get(line.index);
    if (split && line.shabados) {
      const [p1, p2] = splitText(line.shabados.gurmukhiClean, split.wordIndex);
      sosExpanded.push({
        data: { ...line.shabados, gurmukhi: p1, gurmukhiClean: p1 },
        originalIndex: line.index,
        isSplitFragment: false,
      });
      if (p2) {
        sosExpanded.push({
          data: { ...line.shabados, gurmukhi: p2, gurmukhiClean: p2 },
          originalIndex: line.index,
          isSplitFragment: true,
        });
      }
    } else {
      sosExpanded.push({ data: line.shabados, originalIndex: line.index, isSplitFragment: false });
    }
  }

  const bdbExpanded: BdbEntry[] = [];
  for (const line of lines) {
    const split = bdbSplitMap.get(line.index);
    if (split && line.banidb) {
      const [p1, p2] = splitText(line.banidb.unicode, split.wordIndex);
      bdbExpanded.push({
        data: { ...line.banidb, unicode: p1 },
        originalIndex: line.index,
        isSplitFragment: false,
      });
      if (p2) {
        bdbExpanded.push({
          data: { ...line.banidb, unicode: p2 },
          originalIndex: line.index,
          isSplitFragment: true,
        });
      }
    } else {
      bdbExpanded.push({ data: line.banidb, originalIndex: line.index, isSplitFragment: false });
    }
  }

  const count = Math.max(sosExpanded.length, bdbExpanded.length);
  const result: RenderedLine[] = [];

  for (let i = 0; i < count; i++) {
    const sos = sosExpanded[i] ?? { data: null, originalIndex: null, isSplitFragment: false };
    const bdb = bdbExpanded[i] ?? { data: null, originalIndex: null, isSplitFragment: false };

    const shabados = sos.data;
    const banidb = bdb.data;

    let hasDiff: boolean;
    let shabadosDiff: DiffToken[];
    let banidbDiff: DiffToken[];

    if (shabados && banidb) {
      const d = diffRaw(shabados.gurmukhiClean, banidb.unicode);
      hasDiff = d.hasDiff;
      shabadosDiff = d.aDiff;
      banidbDiff = d.bDiff;
    } else if (shabados) {
      hasDiff = true;
      shabadosDiff = equalTokens(shabados.gurmukhiClean);
      banidbDiff = [];
    } else if (banidb) {
      hasDiff = true;
      shabadosDiff = [];
      banidbDiff = equalTokens(banidb.unicode);
    } else {
      hasDiff = false;
      shabadosDiff = [];
      banidbDiff = [];
    }

    // A row is a split fragment when either side is a part-2 entry.
    const isSplitFragment = sos.isSplitFragment || bdb.isSplitFragment;

    // Which split produced the fragment? Prefer BDB; fall back to SOS.
    let splitSource: RenderedLine["splitSource"] = null;
    if (bdb.isSplitFragment && bdb.originalIndex !== null) {
      splitSource = { lineIndex: bdb.originalIndex, side: "banidb" };
    } else if (sos.isSplitFragment && sos.originalIndex !== null) {
      splitSource = { lineIndex: sos.originalIndex, side: "shabados" };
    }

    result.push({
      shabados,
      banidb,
      hasDiff,
      shabadosDiff,
      banidbDiff,
      renderKey: `${sos.originalIndex ?? "x"}-${bdb.originalIndex ?? "x"}`,
      isSplitFragment,
      // Don't offer ✂ on a split-fragment cell (the part2 content)
      canSplitShabados: !sos.isSplitFragment,
      canSplitBanidb: !bdb.isSplitFragment,
      sosOriginalIndex: sos.originalIndex,
      bdbOriginalIndex: bdb.originalIndex,
      splitSource,
    });
  }

  return result;
}
