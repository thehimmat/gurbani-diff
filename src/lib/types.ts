export type SourceKey = "SGGS" | "DASAM";

export type SourceConfig = {
  label: string;
  shabadosId: string;
  banidbId: string;
  maxPage: number;
  unit: string;
};

export const SOURCES: Record<SourceKey, SourceConfig> = {
  SGGS: {
    label: "Sri Guru Granth Sahib Ji",
    shabadosId: "SGGS",
    banidbId: "G",
    maxPage: 1430,
    unit: "Ang",
  },
  DASAM: {
    label: "Dasam Bani",
    shabadosId: "SDGR",
    banidbId: "D",
    maxPage: 1428,
    unit: "Page",
  },
};

export type ShabadosLineData = {
  id: string;
  gurmukhi: string;
  gurmukhiClean: string;
  pageNo: number;
  lineNo: number;
  authorId?: string;
  authorName?: string;
  translations: { language: string; text: string; source: string }[];
  notes: { language: string; text: string; source: string }[];
};

export type BanidbVisraam = { p: number; t: string }[];

export type BanidbVerseData = {
  verseId: number;
  shabadId: number;
  unicode: string;
  gurmukhi: string;
  pageNo: number;
  lineNo: number;
  writer: { id: number; english: string; gurmukhi: string } | null;
  raag: {
    raagId: number;
    english: string;
    unicode: string;
    raagWithPage: string;
  } | null;
  visraam: {
    sttm2: BanidbVisraam;
    sttm: BanidbVisraam;
    igurbani: BanidbVisraam;
  };
  transliteration: { english: string; ipa?: string };
  translations: Record<string, unknown>;
};

export type DiffToken = {
  text: string;
  type: "equal" | "added" | "removed";
};

export type CompareLine = {
  index: number;
  shabados: ShabadosLineData | null;
  banidb: BanidbVerseData | null;
  hasDiff: boolean;
  shabadosDiff: DiffToken[];
  banidbDiff: DiffToken[];
};

export type CompareResult = {
  sourceKey: SourceKey;
  pageNo: number;
  maxPage: number;
  navigation: { previous: number | null; next: number | null };
  lines: CompareLine[];
  diffCount: number;
};
