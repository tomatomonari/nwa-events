"use client";

import { useState, useRef, useEffect } from "react";
import type { PrimaryCategory } from "@/lib/types";

interface CategoryFilterProps {
  selected: PrimaryCategory | null;
  onChange: (category: PrimaryCategory | null) => void;
  businessCount: number;
  funCount: number;
}

export default function CategoryFilter({ selected, onChange, businessCount, funCount }: CategoryFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const label = selected === "business" ? "Business" : selected === "fun" ? "Fun" : "All Events";

  function select(category: PrimaryCategory | null) {
    onChange(category);
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-border bg-background hover:bg-muted cursor-pointer transition-colors"
      >
        {label}
        <svg
          className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 rounded-lg border border-border bg-background shadow-lg z-50 py-1">
          <button
            onClick={() => select(null)}
            className={`w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors ${
              selected === null ? "font-semibold text-foreground bg-muted" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => select("business")}
            className={`w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between ${
              selected === "business" ? "font-semibold text-foreground bg-muted" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span>Business</span>
            <span className="text-xs tabular-nums">{businessCount}</span>
          </button>
          <button
            onClick={() => select("fun")}
            className={`w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors flex items-center justify-between ${
              selected === "fun" ? "font-semibold text-foreground bg-muted" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span>Fun</span>
            <span className="text-xs tabular-nums">{funCount}</span>
          </button>
        </div>
      )}
    </div>
  );
}
