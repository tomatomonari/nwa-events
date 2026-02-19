"use client";

import { CATEGORIES } from "@/lib/types";

interface CategoryFilterProps {
  selected: string | null;
  onChange: (category: string | null) => void;
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
          selected === null
            ? "bg-foreground text-background font-medium"
            : "bg-muted text-muted-foreground hover:bg-border"
        }`}
      >
        All
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value === selected ? null : cat.value)}
          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
            selected === cat.value
              ? "bg-foreground text-background font-medium"
              : "bg-muted text-muted-foreground hover:bg-border"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
