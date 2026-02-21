"use client";

import type { PrimaryCategory } from "@/lib/types";

interface CategoryFilterProps {
  selected: PrimaryCategory | null;
  onChange: (category: PrimaryCategory | null) => void;
  businessCount: number;
  funCount: number;
}

export default function CategoryFilter({ selected, onChange, businessCount, funCount }: CategoryFilterProps) {
  return (
    <div className="flex gap-3">
      <button
        onClick={() => onChange(selected === "business" ? null : "business")}
        className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
          selected === "business"
            ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-500"
            : "border-border hover:border-border/80 hover:shadow-sm"
        }`}
      >
        <span className="text-lg">💼</span>
        <div className="text-left">
          <div className={`text-sm font-semibold ${selected === "business" ? "text-blue-700 dark:text-blue-300" : ""}`}>
            Business
          </div>
          <div className="text-xs text-muted-foreground">{businessCount} events</div>
        </div>
      </button>

      <button
        onClick={() => onChange(selected === "fun" ? null : "fun")}
        className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
          selected === "fun"
            ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-500"
            : "border-border hover:border-border/80 hover:shadow-sm"
        }`}
      >
        <span className="text-lg">🎉</span>
        <div className="text-left">
          <div className={`text-sm font-semibold ${selected === "fun" ? "text-amber-700 dark:text-amber-300" : ""}`}>
            Fun
          </div>
          <div className="text-xs text-muted-foreground">{funCount} events</div>
        </div>
      </button>
    </div>
  );
}
