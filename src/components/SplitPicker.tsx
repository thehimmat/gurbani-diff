"use client";

import { useState } from "react";
import { Fragment } from "react";

type Props = {
  text: string;
  onSplit: (wordIndex: number) => void;
  onCancel: () => void;
};

export function SplitPicker({ text, onSplit, onCancel }: Props) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const [hoveredGap, setHoveredGap] = useState<number | null>(null);

  const wordClass = (i: number) => {
    if (hoveredGap === null) return "text-stone-100";
    return i <= hoveredGap ? "text-amber-200" : "text-stone-400";
  };

  return (
    <span
      className="font-gurmukhi text-lg leading-relaxed select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {words.map((word, i) => (
        <Fragment key={i}>
          <span className={wordClass(i)}>{word}</span>
          {i < words.length - 1 && (
            <button
              className="mx-0.5 px-1 font-sans text-stone-600 hover:text-amber-400 rounded hover:bg-amber-500/20 transition-colors"
              onMouseEnter={() => setHoveredGap(i)}
              onMouseLeave={() => setHoveredGap(null)}
              onClick={(e) => {
                e.stopPropagation();
                onSplit(i);
              }}
              title={`Split after word ${i + 1}`}
            >
              |
            </button>
          )}
        </Fragment>
      ))}
      <button
        className="ml-3 font-sans text-xs text-stone-600 hover:text-stone-300 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onCancel();
        }}
      >
        cancel
      </button>
    </span>
  );
}
