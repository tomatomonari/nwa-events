export const SIGNAL_REGISTRY = {
  free_food: {
    label: "Free Food",
    keywords: ["free food", "lunch provided", "complimentary food", "free lunch", "free dinner", "free breakfast"],
    color: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300",
    supersededBy: null,
  },
  food: {
    label: "Food",
    keywords: ["food", "lunch", "snacks", "pizza", "dinner", "breakfast", "catering", "light bites"],
    color: "bg-lime-100 text-lime-700 dark:bg-lime-950/40 dark:text-lime-300",
    supersededBy: "free_food" as const,
  },
  free_drinks: {
    label: "Free Drinks",
    keywords: ["free drinks", "open bar", "drinks provided", "complimentary drinks", "free beer", "free wine"],
    color: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
    supersededBy: null,
  },
  drinks: {
    label: "Drinks",
    keywords: ["drinks", "beer", "happy hour", "wine", "cocktails", "bar"],
    color: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    supersededBy: "free_drinks" as const,
  },
  age_21_plus: {
    label: "21+",
    keywords: ["21+", "21 and over", "must be 21", "ages 21"],
    color: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    supersededBy: null,
  },
} as const;

export type SignalCode = keyof typeof SIGNAL_REGISTRY;

const ALL_CODES = Object.keys(SIGNAL_REGISTRY) as SignalCode[];

export function extractSignals(description: string | null): SignalCode[] {
  if (!description) return [];

  const text = description.toLowerCase();
  const matched = new Set<SignalCode>();

  for (const code of ALL_CODES) {
    const def = SIGNAL_REGISTRY[code];
    for (const kw of def.keywords) {
      if (text.includes(kw)) {
        matched.add(code);
        break;
      }
    }
  }

  // Apply superseding: if the superseding signal is present, remove the superseded one
  for (const code of ALL_CODES) {
    const def = SIGNAL_REGISTRY[code];
    if (def.supersededBy && matched.has(def.supersededBy)) {
      matched.delete(code);
    }
  }

  return Array.from(matched);
}

export function getSignalDef(code: string) {
  return SIGNAL_REGISTRY[code as SignalCode] ?? null;
}
