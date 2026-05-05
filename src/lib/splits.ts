import type { CompareLine, LineSplit, DiffToken } from "./types";
import { diffRaw, tokenize } from "./diff";

export type RenderedLine = CompareLine & {
  renderKey: string;
  canSplit: boolean;
  isSplitFragment: boolean;
};

export function applyLineSplits(
  lines: CompareLine[],
  splits: LineSplit[]
): RenderedLine[] {
  if (splits.length === 0) {
    return lines.map((l) => ({
      ...l,
      renderKey: String(l.index),
      canSplit: true,
      isSplitFragment: false,
    }));
  }

  const splitMap = new Map<number, { shabados?: LineSplit; banidb?: LineSplit }>();
  for (const split of splits) {
    const entry = splitMap.get(split.lineIndex) ?? {};
    entry[split.side] = split;
    splitMap.set(split.lineIndex, entry);
  }

  return lines.flatMap((line) => {
    const lineSplits = splitMap.get(line.index);
    if (!lineSplits) {
      return [{ ...line, renderKey: String(line.index), canSplit: true, isSplitFragment: false }];
    }

    const { shabados: sosSplit, banidb: bdbSplit } = lineSplits;

    if (sosSplit && bdbSplit && line.shabados && line.banidb) {
      return splitBothSides(line, sosSplit, bdbSplit);
    }
    if (sosSplit && line.shabados) {
      return splitOneSide(line, sosSplit);
    }
    if (bdbSplit && line.banidb) {
      return splitOneSide(line, bdbSplit);
    }

    return [{ ...line, renderKey: String(line.index), canSplit: true, isSplitFragment: false }];
  });
}

function splitWords(text: string, wordIndex: number): [string, string] {
  const words = tokenize(text);
  const clamped = Math.max(0, Math.min(wordIndex, words.length - 2));
  return [
    words.slice(0, clamped + 1).join(" "),
    words.slice(clamped + 1).join(" "),
  ];
}

function equalTokens(text: string): DiffToken[] {
  return tokenize(text).map((word) => ({ text: word, type: "equal" as const }));
}

function splitOneSide(line: CompareLine, split: LineSplit): [RenderedLine, RenderedLine] {
  const key = line.index;

  if (split.side === "shabados" && line.shabados) {
    const [p1, p2] = splitWords(line.shabados.gurmukhiClean, split.wordIndex);

    let aDiff: DiffToken[], bDiff: DiffToken[], hasDiff: boolean;
    if (p1 && line.banidb) {
      ({ aDiff, bDiff, hasDiff } = diffRaw(p1, line.banidb.unicode));
    } else {
      aDiff = p1 ? equalTokens(p1) : [];
      bDiff = line.banidb ? equalTokens(line.banidb.unicode) : [];
      hasDiff = false;
    }

    const rowA: RenderedLine = {
      ...line,
      shabados: { ...line.shabados, gurmukhi: p1, gurmukhiClean: p1 },
      banidb: line.banidb,
      hasDiff,
      shabadosDiff: aDiff,
      banidbDiff: bDiff,
      renderKey: `${key}-a`,
      canSplit: false,
      isSplitFragment: false,
    };
    const rowB: RenderedLine = {
      ...line,
      shabados: p2 ? { ...line.shabados, gurmukhi: p2, gurmukhiClean: p2 } : null,
      banidb: null,
      hasDiff: false,
      shabadosDiff: p2 ? equalTokens(p2) : [],
      banidbDiff: [],
      renderKey: `${key}-b`,
      canSplit: false,
      isSplitFragment: true,
    };
    return [rowA, rowB];
  }

  // split.side === "banidb"
  const banidb = line.banidb!;
  const [p1, p2] = splitWords(banidb.unicode, split.wordIndex);

  let aDiff: DiffToken[], bDiff: DiffToken[], hasDiff: boolean;
  if (line.shabados && p1) {
    ({ aDiff, bDiff, hasDiff } = diffRaw(line.shabados.gurmukhiClean, p1));
  } else {
    aDiff = line.shabados ? equalTokens(line.shabados.gurmukhiClean) : [];
    bDiff = p1 ? equalTokens(p1) : [];
    hasDiff = false;
  }

  const rowA: RenderedLine = {
    ...line,
    shabados: line.shabados,
    banidb: { ...banidb, unicode: p1 },
    hasDiff,
    shabadosDiff: aDiff,
    banidbDiff: bDiff,
    renderKey: `${key}-a`,
    canSplit: false,
    isSplitFragment: false,
  };
  const rowB: RenderedLine = {
    ...line,
    shabados: null,
    banidb: p2 ? { ...banidb, unicode: p2 } : null,
    hasDiff: false,
    shabadosDiff: [],
    banidbDiff: p2 ? equalTokens(p2) : [],
    renderKey: `${key}-b`,
    canSplit: false,
    isSplitFragment: true,
  };
  return [rowA, rowB];
}

function splitBothSides(
  line: CompareLine,
  sosSplit: LineSplit,
  bdbSplit: LineSplit
): [RenderedLine, RenderedLine] {
  const key = line.index;
  const shabados = line.shabados!;
  const banidb = line.banidb!;

  const [sosPart1, sosPart2] = splitWords(shabados.gurmukhiClean, sosSplit.wordIndex);
  const [bdbPart1, bdbPart2] = splitWords(banidb.unicode, bdbSplit.wordIndex);

  const { aDiff: aDiff1, bDiff: bDiff1, hasDiff: hasDiff1 } = diffRaw(sosPart1, bdbPart1);
  const { aDiff: aDiff2, bDiff: bDiff2, hasDiff: hasDiff2 } = diffRaw(sosPart2, bdbPart2);

  const rowA: RenderedLine = {
    ...line,
    shabados: { ...shabados, gurmukhi: sosPart1, gurmukhiClean: sosPart1 },
    banidb: { ...banidb, unicode: bdbPart1 },
    hasDiff: hasDiff1,
    shabadosDiff: aDiff1,
    banidbDiff: bDiff1,
    renderKey: `${key}-a`,
    canSplit: false,
    isSplitFragment: false,
  };
  const rowB: RenderedLine = {
    ...line,
    shabados: sosPart2 ? { ...shabados, gurmukhi: sosPart2, gurmukhiClean: sosPart2 } : null,
    banidb: bdbPart2 ? { ...banidb, unicode: bdbPart2 } : null,
    hasDiff: hasDiff2,
    shabadosDiff: sosPart2 ? aDiff2 : [],
    banidbDiff: bdbPart2 ? bDiff2 : [],
    renderKey: `${key}-b`,
    canSplit: false,
    isSplitFragment: true,
  };
  return [rowA, rowB];
}
