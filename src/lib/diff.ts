import type { DiffToken } from "./types";

// Strip Shabad OS vishraam markers: ; (lagg), . (yakash), , (comma)
export function stripVishraam(text: string): string {
  return text
    .replace(/[;.,]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

// Simple LCS-based word diff
function lcs(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp;
}

function backtrack(
  dp: number[][],
  a: string[],
  b: string[],
  i: number,
  j: number,
  aDiff: DiffToken[],
  bDiff: DiffToken[]
): void {
  if (i === 0 && j === 0) return;
  if (i === 0) {
    backtrack(dp, a, b, i, j - 1, aDiff, bDiff);
    bDiff.push({ text: b[j - 1], type: "added" });
  } else if (j === 0) {
    backtrack(dp, a, b, i - 1, j, aDiff, bDiff);
    aDiff.push({ text: a[i - 1], type: "removed" });
  } else if (a[i - 1] === b[j - 1]) {
    backtrack(dp, a, b, i - 1, j - 1, aDiff, bDiff);
    aDiff.push({ text: a[i - 1], type: "equal" });
    bDiff.push({ text: b[j - 1], type: "equal" });
  } else if (dp[i - 1][j] >= dp[i][j - 1]) {
    backtrack(dp, a, b, i - 1, j, aDiff, bDiff);
    aDiff.push({ text: a[i - 1], type: "removed" });
  } else {
    backtrack(dp, a, b, i, j - 1, aDiff, bDiff);
    bDiff.push({ text: b[j - 1], type: "added" });
  }
}

export function diffGurmukhi(
  shabadosText: string,
  banidbText: string
): { shabadosDiff: DiffToken[]; banidbDiff: DiffToken[]; hasDiff: boolean } {
  const aClean = stripVishraam(shabadosText);
  const bClean = banidbText.trim();

  const aTokens = tokenize(aClean);
  const bTokens = tokenize(bClean);

  if (aTokens.length === 0 && bTokens.length === 0) {
    return { shabadosDiff: [], banidbDiff: [], hasDiff: false };
  }

  const dp = lcs(aTokens, bTokens);
  const aDiff: DiffToken[] = [];
  const bDiff: DiffToken[] = [];
  backtrack(dp, aTokens, bTokens, aTokens.length, bTokens.length, aDiff, bDiff);

  const hasDiff = aDiff.some((t) => t.type !== "equal") || bDiff.some((t) => t.type !== "equal");
  return { shabadosDiff: aDiff, banidbDiff: bDiff, hasDiff };
}
