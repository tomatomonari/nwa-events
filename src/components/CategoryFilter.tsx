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

  const briefcaseIcon = (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );

  const sparkleIcon = (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );

  const triggerIcon = selected === "business" ? briefcaseIcon : selected === "fun" ? sparkleIcon : null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-border bg-background hover:bg-muted cursor-pointer transition-colors"
      >
        {triggerIcon}
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
        <div className="absolute right-0 mt-1 w-48 rounded-lg border border-border bg-background shadow-lg z-50 py-1.5">
          <button
            onClick={() => select(null)}
            className={`w-full text-left px-3 py-2.5 text-sm cursor-pointer transition-colors ${
              selected === null ? "font-semibold text-foreground bg-muted" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => select("business")}
            className={`w-full text-left px-3 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${
              selected === "business" ? "font-semibold text-foreground bg-muted" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-2">{briefcaseIcon} Business</span>
            <span className="text-xs tabular-nums">{businessCount}</span>
          </button>
          <button
            onClick={() => select("fun")}
            className={`w-full text-left px-3 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${
              selected === "fun" ? "font-semibold text-foreground bg-muted" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-2">{sparkleIcon} Fun</span>
            <span className="text-xs tabular-nums">{funCount}</span>
          </button>
        </div>
      )}
    </div>
  );
}
