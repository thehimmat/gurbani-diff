import type { NextRequest } from "next/server";
import { SOURCES, type CompareResult, type CompareLine, type DiffToken } from "@/lib/types";
import { getShabadosPage } from "@/lib/shabados";
import { getBanidbPage } from "@/lib/banidb";
import { diffGurmukhi } from "@/lib/diff";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sourceKey = (searchParams.get("source") ?? "SGGS") as keyof typeof SOURCES;
  const pageNo = parseInt(searchParams.get("page") ?? "1", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const sourceConfig = SOURCES[sourceKey];
  if (!sourceConfig) {
    return Response.json({ error: "Invalid source" }, { status: 400 });
  }

  const clampedPage = Math.max(1, Math.min(pageNo, sourceConfig.maxPage));

  try {
    const [rawShabados, banidbResult] = await Promise.all([
      Promise.resolve(getShabadosPage(sourceConfig.shabadosId, clampedPage)),
      getBanidbPage(sourceConfig.banidbId, clampedPage),
    ]);

    const shabadosLines = offset < 0 ? rawShabados.slice(-offset) : rawShabados;
    const banidbVerses = offset > 0 ? banidbResult.verses.slice(offset) : banidbResult.verses;

    const count = Math.max(shabadosLines.length, banidbVerses.length);
    const lines: CompareLine[] = [];
    let diffCount = 0;

    for (let i = 0; i < count; i++) {
      const shabados = shabadosLines[i] ?? null;
      const banidb = banidbVerses[i] ?? null;

      let hasDiff = false;
      let shabadosDiff: DiffToken[] = shabados ? [{ text: shabados.gurmukhiClean, type: "equal" }] : [];
      let banidbDiff: DiffToken[] = banidb ? [{ text: banidb.unicode, type: "equal" }] : [];

      if (shabados && banidb) {
        const result = diffGurmukhi(shabados.gurmukhi, banidb.unicode);
        hasDiff = result.hasDiff;
        shabadosDiff = result.shabadosDiff;
        banidbDiff = result.banidbDiff;
        if (hasDiff) diffCount++;
      } else if (shabados || banidb) {
        hasDiff = true;
        diffCount++;
      }

      lines.push({ index: i, shabados, banidb, hasDiff, shabadosDiff, banidbDiff });
    }

    const result: CompareResult = {
      sourceKey,
      pageNo: clampedPage,
      maxPage: sourceConfig.maxPage,
      navigation: banidbResult.navigation,
      lines,
      diffCount,
    };

    return Response.json(result);
  } catch (err) {
    console.error("Compare API error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
