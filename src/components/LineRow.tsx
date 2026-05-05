"use client";

import { useState } from "react";
import type { CompareLine } from "@/lib/types";
import { MetaPanel } from "./MetaPanel";

type Props = {
  line: CompareLine;
  lineNumber: number;
};

function DiffText({ tokens }: { tokens: CompareLine["shabadosDiff"] }) {
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
            <span
              key={i}
              className="bg-red-900/50 text-red-300 rounded px-0.5"
            >
              {token.text}{" "}
            </span>
          );
        }
        return (
          <span
            key={i}
            className="bg-emerald-900/50 text-emerald-300 rounded px-0.5"
          >
            {token.text}{" "}
          </span>
        );
      })}
    </span>
  );
}

export function LineRow({ line, lineNumber }: Props) {
  const [expanded, setExpanded] = useState(false);

  const lineNo = line.shabados?.lineNo ?? line.banidb?.lineNo ?? lineNumber;
  const rowBg = line.hasDiff ? "bg-amber-950/20" : "";

  return (
    <>
      <tr
        className={`border-b border-stone-800 hover:bg-stone-800/30 transition-colors cursor-pointer ${rowBg}`}
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Line number */}
        <td className="w-10 text-center text-xs text-stone-600 py-3 px-2 align-top select-none">
          {lineNo}
          {line.hasDiff && (
            <span className="block text-amber-500 text-[10px]">⚡</span>
          )}
        </td>

        {/* Shabad OS column */}
        <td className="py-3 px-4 align-top border-r border-stone-800 w-1/2">
          {line.shabados ? (
            <DiffText tokens={line.shabadosDiff} />
          ) : (
            <span className="text-stone-600 text-sm italic">—</span>
          )}
        </td>

        {/* BaniDB column */}
        <td className="py-3 px-4 align-top w-1/2">
          {line.banidb ? (
            <DiffText tokens={line.banidbDiff} />
          ) : (
            <span className="text-stone-600 text-sm italic">—</span>
          )}
        </td>
      </tr>

      {expanded && (
        <MetaPanel shabados={line.shabados} banidb={line.banidb} />
      )}
    </>
  );
}
