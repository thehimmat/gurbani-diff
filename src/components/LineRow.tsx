"use client";

import { useState } from "react";
import type { DiffToken } from "@/lib/types";
import type { RenderedLine } from "@/lib/splits";
import { MetaPanel } from "./MetaPanel";
import { SplitPicker } from "./SplitPicker";

type Props = {
  line: RenderedLine;
  lineNumber: number;
  onSplit?: (side: "shabados" | "banidb", wordIndex: number) => void;
  onUnsplit?: () => void;
};

function DiffText({ tokens }: { tokens: DiffToken[] }) {
  return (
    <span className="font-gurmukhi text-lg leading-relaxed">
      {tokens.map((token, i) => {
        if (token.type === "equal") {
          return (
            <span key={i} className="text-stone-100">
              {token.text}{" "}
            </span>
          );
        }
        if (token.type === "removed") {
          return (
            <span key={i} className="bg-red-900/50 text-red-300 rounded px-0.5">
              {token.text}{" "}
            </span>
          );
        }
        return (
          <span key={i} className="bg-emerald-900/50 text-emerald-300 rounded px-0.5">
            {token.text}{" "}
          </span>
        );
      })}
    </span>
  );
}

export function LineRow({ line, lineNumber, onSplit, onUnsplit }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [splitMode, setSplitMode] = useState<"shabados" | "banidb" | null>(null);

  const lineNo = line.shabados?.lineNo ?? line.banidb?.lineNo ?? lineNumber;
  const rowBg = line.hasDiff ? "bg-amber-950/20" : "";

  const handleRowClick = () => {
    if (splitMode) return;
    if (!line.isSplitFragment) setExpanded((e) => !e);
  };

  const renderCell = (
    side: "shabados" | "banidb",
    tokens: DiffToken[],
    text: string
  ) => {
    if (splitMode === side) {
      return (
        <SplitPicker
          text={text}
          onSplit={(wi) => {
            setSplitMode(null);
            onSplit?.(side, wi);
          }}
          onCancel={() => setSplitMode(null)}
        />
      );
    }
    return (
      <div className="relative group/cell">
        <DiffText tokens={tokens} />
        {line.canSplit && onSplit && !splitMode && (
          <button
            className="absolute top-0 right-0 opacity-0 group-hover/cell:opacity-100 text-[11px] text-stone-600 hover:text-amber-400 transition-opacity px-1 py-0.5"
            title="Split this line at a word boundary"
            onClick={(e) => {
              e.stopPropagation();
              setSplitMode(side);
            }}
          >
            ✂
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <tr
        className={`border-b border-stone-800 hover:bg-stone-800/30 transition-colors ${line.isSplitFragment ? "" : "cursor-pointer"} ${rowBg}`}
        onClick={handleRowClick}
      >
        <td className="w-10 text-center text-xs text-stone-600 py-3 px-2 align-top select-none">
          {line.isSplitFragment && onUnsplit ? (
            <button
              className="text-stone-600 hover:text-amber-400 transition-colors"
              title="Remove split — merge back into previous row"
              onClick={(e) => {
                e.stopPropagation();
                onUnsplit();
              }}
            >
              ↩
            </button>
          ) : (
            <>
              {lineNo}
              {line.hasDiff && (
                <span className="block text-amber-500 text-[10px]">⚡</span>
              )}
            </>
          )}
        </td>

        <td className="py-3 px-4 align-top border-r border-stone-800 w-1/2">
          {line.shabados ? (
            renderCell("shabados", line.shabadosDiff, line.shabados.gurmukhiClean)
          ) : (
            <span className="text-stone-600 text-sm italic">—</span>
          )}
        </td>

        <td className="py-3 px-4 align-top w-1/2">
          {line.banidb ? (
            renderCell("banidb", line.banidbDiff, line.banidb.unicode)
          ) : (
            <span className="text-stone-600 text-sm italic">—</span>
          )}
        </td>
      </tr>

      {expanded && !line.isSplitFragment && (
        <MetaPanel shabados={line.shabados} banidb={line.banidb} />
      )}
    </>
  );
}
