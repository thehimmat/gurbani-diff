import type { BanidbVerseData } from "./types";

const BASE_URL = "https://api.banidb.com/v2";

type BanidbApiResponse = {
  source: {
    sourceId: string;
    gurmukhi: string;
    english: string;
    pageNo: number;
  };
  count: number;
  navigation: { previous: number | null; next: number | null };
  page: BanidbApiVerse[];
};

type BanidbApiVerse = {
  verseId: number;
  shabadId: number;
  verse: { gurmukhi: string; unicode: string };
  pageNo: number;
  lineNo: number;
  writer: { writerId: number; gurmukhi: string; unicode: string | null; english: string } | null;
  raag: { raagId: number; gurmukhi: string; unicode: string; english: string; raagWithPage: string } | null;
  visraam: {
    sttm2: { p: number; t: string }[];
    sttm: { p: number; t: string }[];
    igurbani: { p: number; t: string }[];
  };
  transliteration: { english: string; ipa?: string };
  translation: Record<string, unknown>;
};

export type BanidbPageResult = {
  navigation: { previous: number | null; next: number | null };
  verses: BanidbVerseData[];
};

export async function getBanidbPage(
  sourceId: string,
  pageNo: number
): Promise<BanidbPageResult> {
  const url = `${BASE_URL}/angs/${pageNo}/${sourceId}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`BaniDB API error: ${res.status} for ${url}`);
  }
  const data = (await res.json()) as BanidbApiResponse;

  const verses: BanidbVerseData[] = (data.page ?? []).map((v) => ({
    verseId: v.verseId,
    shabadId: v.shabadId,
    unicode: v.verse?.unicode ?? "",
    gurmukhi: v.verse?.gurmukhi ?? "",
    pageNo: v.pageNo,
    lineNo: v.lineNo,
    writer: v.writer
      ? {
          id: v.writer.writerId,
          english: v.writer.english,
          gurmukhi: v.writer.gurmukhi,
        }
      : null,
    raag: v.raag
      ? {
          raagId: v.raag.raagId,
          english: v.raag.english,
          unicode: v.raag.unicode,
          raagWithPage: v.raag.raagWithPage,
        }
      : null,
    visraam: v.visraam ?? { sttm2: [], sttm: [], igurbani: [] },
    transliteration: { english: v.transliteration?.english ?? "", ipa: v.transliteration?.ipa },
    translations: v.translation ?? {},
  }));

  return {
    navigation: data.navigation ?? { previous: null, next: null },
    verses,
  };
}
