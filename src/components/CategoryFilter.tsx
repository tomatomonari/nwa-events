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
            ? "border-indigo-400 bg-indigo-500 text-white"
            : "border-border hover:border-border/80 hover:shadow-sm"
        }`}
      >
        {selected === "business" ? (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <svg className="w-5 h-5 flex-shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        )}
        <div className="text-left">
          <div className="text-sm font-semibold">Business</div>
          <div className={`text-xs ${selected === "business" ? "text-indigo-100" : "text-muted-foreground"}`}>{businessCount} events</div>
        </div>
      </button>

      <button
        onClick={() => onChange(selected === "fun" ? null : "fun")}
        className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
          selected === "fun"
            ? "border-indigo-400 bg-indigo-500 text-white"
            : "border-border hover:border-border/80 hover:shadow-sm"
        }`}
      >
        {selected === "fun" ? (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <svg className="w-5 h-5 flex-shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        )}
        <div className="text-left">
          <div className="text-sm font-semibold">Fun</div>
          <div className={`text-xs ${selected === "fun" ? "text-indigo-100" : "text-muted-foreground"}`}>{funCount} events</div>
        </div>
      </button>
    </div>
  );
}
