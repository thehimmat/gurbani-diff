"use client";

import { useState } from "react";
import type { ShabadosLineData, BanidbVerseData } from "@/lib/types";

type Props = {
  shabados: ShabadosLineData | null;
  banidb: BanidbVerseData | null;
};

type TranslationEntry = { language: string; text: string; source: string };

function renderVisraam(
  visraam: BanidbVerseData["visraam"],
  unicode: string
): string {
  const all = [
    ...visraam.sttm2.map((v) => ({ ...v, src: "sttm2" })),
    ...visraam.sttm.map((v) => ({ ...v, src: "sttm" })),
    ...visraam.igurbani.map((v) => ({ ...v, src: "igurbani" })),
  ];
  if (all.length === 0) return "—";
  const words = unicode.split(" ");
  return all
    .map((v) => `${words[v.p] ?? "?"}(${v.t})[${v.src}]`)
    .join(", ");
}

export function MetaPanel({ shabados, banidb }: Props) {
  const [open, setOpen] = useState(false);

  const hasContent = shabados || banidb;
  if (!hasContent) return null;

  return (
    <tr>
      <td colSpan={3} className="px-0 py-0">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-full text-left px-4 py-1 text-xs text-stone-500 hover:text-stone-300 hover:bg-stone-800/50 transition-colors"
        >
          {open ? "▲ hide metadata" : "▼ show metadata"}
        </button>

        {open && (
          <div className="grid grid-cols-2 gap-0 border-t border-stone-800">
            {/* Shabad OS metadata */}
            <div className="px-4 py-3 border-r border-stone-800 text-xs space-y-2">
              <div className="font-semibold text-stone-300">Shabad OS</div>
              {shabados?.authorName && (
                <div>
                  <span className="text-stone-500">Author: </span>
                  <span className="text-stone-300">{shabados.authorName}</span>
                </div>
              )}
              {shabados?.gurmukhi !== shabados?.gurmukhiClean && (
                <div>
                  <span className="text-stone-500">With vishraam: </span>
                  <span className="text-stone-200 font-gurmukhi">{shabados?.gurmukhi}</span>
                </div>
              )}
              {shabados && shabados.translations.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-stone-500">Translations:</div>
                  {(shabados.translations as TranslationEntry[])
                    .filter((t) => t.language === "en")
                    .slice(0, 2)
                    .map((t, i) => (
                      <div key={i} className="pl-2 border-l border-stone-700">
                        <div className="text-stone-500 text-[10px]">{t.source}</div>
                        <div className="text-stone-300">{t.text}</div>
                      </div>
                    ))}
                </div>
              )}
              {shabados && shabados.notes.length > 0 && (
                <div>
                  <div className="text-stone-500 mb-1">Notes ({shabados.notes.length}):</div>
                  <div className="pl-2 border-l border-stone-700 text-stone-400 text-[10px]">
                    {shabados.notes[0].source}
                  </div>
                </div>
              )}
            </div>

            {/* BaniDB metadata */}
            <div className="px-4 py-3 text-xs space-y-2">
              <div className="font-semibold text-stone-300">BaniDB</div>
              {banidb?.writer && (
                <div>
                  <span className="text-stone-500">Author: </span>
                  <span className="text-stone-300">{banidb.writer.english}</span>
                </div>
              )}
              {banidb?.raag && (
                <div>
                  <span className="text-stone-500">Raag: </span>
                  <span className="text-stone-300">{banidb.raag.raagWithPage}</span>
                </div>
              )}
              {banidb?.transliteration.english && (
                <div>
                  <span className="text-stone-500">Transliteration: </span>
                  <span className="text-stone-400 italic">{banidb.transliteration.english}</span>
                </div>
              )}
              {banidb && (
                <div>
                  <span className="text-stone-500">Vishraam: </span>
                  <span className="text-stone-400">
                    {renderVisraam(banidb.visraam, banidb.unicode)}
                  </span>
                </div>
              )}
              {banidb?.translations && (() => {
                const enTrans = (banidb.translations as Record<string, Record<string, string>>)?.en;
                if (!enTrans) return null;
                const firstEn = Object.values(enTrans).find((v) => typeof v === "string");
                if (!firstEn) return null;
                return (
                  <div className="space-y-1">
                    <div className="text-stone-500">Translation (EN):</div>
                    <div className="pl-2 border-l border-stone-700 text-stone-300">
                      {firstEn}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}
