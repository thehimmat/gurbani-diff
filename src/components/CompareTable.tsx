"use client";

import type { CompareResult } from "@/lib/types";
import { LineRow } from "./LineRow";

type Props = {
  result: CompareResult;
  diffsOnly?: boolean;
};

export function CompareTable({ result, diffsOnly = false }: Props) {
  const lines = diffsOnly ? result.lines.filter((l) => l.hasDiff) : result.lines;
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="border-b border-stone-700">
            <th className="w-10 text-xs text-stone-500 py-2 px-2 font-normal">#</th>
            <th className="w-1/2 text-xs text-stone-400 py-2 px-4 text-left font-medium border-r border-stone-700">
              <span className="text-stone-300">Shabad OS</span>
              <span className="ml-2 text-stone-600 font-normal text-[10px]">
                (vishraam markers stripped for diff)
              </span>
            </th>
            <th className="w-1/2 text-xs text-stone-400 py-2 px-4 text-left font-medium">
              <span className="text-stone-300">BaniDB</span>
              <span className="ml-2 text-stone-600 font-normal text-[10px]">
                ({result.lines.filter((l) => l.banidb !== null).length} verses)
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <LineRow key={line.index} line={line} lineNumber={i + 1} />
          ))}
        </tbody>
      </table>

      {lines.length === 0 && (
        <div className="text-center text-stone-500 py-16">
          No lines found for this page.
        </div>
      )}
    </div>
  );
}
