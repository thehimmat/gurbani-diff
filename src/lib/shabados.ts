import Database from "better-sqlite3";
import path from "path";
import type { ShabadosLineData } from "./types";
import { stripVishraam } from "./diff";

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(
      process.cwd(),
      "node_modules/@shabados/database/dist/master.sqlite"
    );
    db = new Database(dbPath, { readonly: true });
  }
  return db;
}

type RawAssetLine = {
  line_id: string;
  type: "primary" | "translation" | "note";
  data: string;
  additional: string;
  asset_name: string | null;
  author_id: string | null;
  author_name: string | null;
  priority: number;
};

export function getShabadosPage(
  sourceId: string,
  pageNo: number
): ShabadosLineData[] {
  const database = getDb();

  // Get all line IDs for this page, ordered by line number then line_group_order
  const lineIds = database
    .prepare(
      `
    SELECT DISTINCT l.id,
           json_extract(al.additional, '$.line') as line_no,
           l.line_group_order,
           lg.section_order,
           lg.author_id,
           json_extract(auth.name, '$.Latn') as author_name
    FROM asset_lines al
    JOIN lines l ON l.id = al.line_id
    JOIN line_groups lg ON lg.id = l.line_group_id
    JOIN sections sec ON sec.id = lg.section_id
    LEFT JOIN authors auth ON auth.id = lg.author_id
    WHERE sec.source_id = ?
      AND al.type = 'primary'
      AND json_extract(al.additional, '$.page') = ?
    ORDER BY json_extract(al.additional, '$.line'), lg.section_order, l.line_group_order
  `
    )
    .all(sourceId, pageNo) as {
    id: string;
    line_no: number;
    line_group_order: number;
    section_order: number;
    author_id: string | null;
    author_name: string | null;
  }[];

  if (lineIds.length === 0) return [];

  const idList = lineIds.map((r) => r.id);
  const placeholders = idList.map(() => "?").join(",");

  // Get all assets for these lines
  const assets = database
    .prepare(
      `
    SELECT al.line_id, al.type, al.data, al.additional,
           json_extract(a.name, '$.en') as asset_name,
           al.priority
    FROM asset_lines al
    LEFT JOIN assets a ON a.id = al.asset_id
    WHERE al.line_id IN (${placeholders})
    ORDER BY al.line_id, al.priority
  `
    )
    .all(...idList) as RawAssetLine[];

  // Group assets by line_id
  const assetsByLine = new Map<string, RawAssetLine[]>();
  for (const asset of assets) {
    const existing = assetsByLine.get(asset.line_id) ?? [];
    existing.push(asset);
    assetsByLine.set(asset.line_id, existing);
  }

  // Build result
  return lineIds.map((row) => {
    const lineAssets = assetsByLine.get(row.id) ?? [];
    const primary = lineAssets.find((a) => a.type === "primary");
    const gurmukhi = primary?.data ?? "";
    const additional = primary?.additional
      ? (JSON.parse(primary.additional) as { page?: number; line?: number })
      : {};

    const translations = lineAssets
      .filter((a) => a.type === "translation")
      .map((a) => {
        const add = JSON.parse(a.additional) as { language?: string };
        return {
          language: add.language ?? "?",
          text: a.data,
          source: a.asset_name ?? "",
        };
      });

    const notes = lineAssets
      .filter((a) => a.type === "note")
      .map((a) => {
        const add = JSON.parse(a.additional) as { language?: string };
        return {
          language: add.language ?? "?",
          text: a.data,
          source: a.asset_name ?? "",
        };
      });

    return {
      id: row.id,
      gurmukhi,
      gurmukhiClean: stripVishraam(gurmukhi),
      pageNo: additional.page ?? pageNo,
      lineNo: additional.line ?? row.line_no,
      authorId: row.author_id ?? undefined,
      authorName: row.author_name ?? undefined,
      translations,
      notes,
    };
  });
}
