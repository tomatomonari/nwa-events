"use client";

import { useState, useMemo } from "react";
import { isToday, isThisWeek, isAfter, endOfWeek } from "date-fns";
import type { Event } from "@/lib/types";
import { trackClick } from "@/lib/tracking";
import EventCard from "./EventCard";
import EventModal from "./EventModal";

interface EventListProps {
  events: Event[];
}

function groupEvents(events: Event[]) {
  const today: Event[] = [];
  const thisWeek: Event[] = [];
  const later: Event[] = [];
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

  for (const event of events) {
    const date = new Date(event.start_date);
    if (isToday(date)) {
      today.push(event);
    } else if (isThisWeek(date, { weekStartsOn: 1 }) && !isToday(date)) {
      thisWeek.push(event);
    } else if (isAfter(date, weekEnd)) {
      later.push(event);
    }
  }

  return { today, thisWeek, later };
}

// --- Subcategory filter (hidden for now, flip to true to re-enable) ---
const SHOW_SUBCATEGORY_FILTER = false;

const BUSINESS_SUBCATEGORIES = [
  { label: "University", emoji: "", icon: "/RightHog.png" },
  { label: "Networking", emoji: "\u{1F91D}" },
  { label: "Startup", emoji: "\u{1F680}" },
  { label: "Hackathon", emoji: "\u{1F4BB}" },
];

const SUBCATEGORY_FILTERS: Record<string, (e: Event) => boolean> = {
  University: (e) => e.source_platform === "hogsync",
};

function SubcategoryGrid({
  selected,
  onToggle,
}: {
  selected: string | null;
  onToggle: (label: string) => void;
}) {
  return (
    <div className="mb-10">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Browse by Category
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {BUSINESS_SUBCATEGORIES.map((sub) => {
          const isSelected = selected === sub.label;
          return (
            <button
              key={sub.label}
              onClick={() => onToggle(sub.label)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                isSelected
                  ? "border-muted-foreground/40 bg-muted text-foreground"
                  : "border-border bg-background hover:border-border/80"
              }`}
            >
              {sub.icon ? (
                <img src={sub.icon} alt={sub.label} className="w-7 h-7 object-contain" />
              ) : (
                <span className="text-2xl">{sub.emoji}</span>
              )}
              <span className="font-medium text-sm">{sub.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
// --- End subcategory filter ---

function EventGroup({ title, events, onSelectEvent }: { title: string; events: Event[]; onSelectEvent: (event: Event, rect: DOMRect) => void }) {
  if (events.length === 0) return null;
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((event) => (
          <EventCard key={event.id} event={event} onClick={(rect) => onSelectEvent(event, rect)} />
        ))}
      </div>
    </div>
  );
}

export default function EventList({ events }: EventListProps) {
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [sourceRect, setSourceRect] = useState<DOMRect | null>(null);

  const filtered = useMemo(() => {
    if (SHOW_SUBCATEGORY_FILTER && selectedSubcategory && SUBCATEGORY_FILTERS[selectedSubcategory]) {
      return events.filter(SUBCATEGORY_FILTERS[selectedSubcategory]);
    }
    return events;
  }, [events, selectedSubcategory]);

  const { today, thisWeek, later } = useMemo(() => groupEvents(filtered), [filtered]);

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          High-signal in-person events in NWA
        </h1>
        <p className="mt-2 text-muted-foreground text-lg">
          Networking, startups, tech, career &mdash; curated from LinkedIn, Luma, Meetup, and more so you don&apos;t have to check them all.
        </p>
      </div>

      {SHOW_SUBCATEGORY_FILTER && (
        <SubcategoryGrid
          selected={selectedSubcategory}
          onToggle={(label) =>
            setSelectedSubcategory((prev) => (prev === label ? null : label))
          }
        />
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No events found.</p>
        </div>
      ) : (
        <div className="space-y-10">
          <EventGroup title="Today" events={today} onSelectEvent={(e, r) => { trackClick(e.id, "view"); setSelectedEvent(e); setSourceRect(r); }} />
          <EventGroup title="This Week" events={thisWeek} onSelectEvent={(e, r) => { trackClick(e.id, "view"); setSelectedEvent(e); setSourceRect(r); }} />
          <EventGroup title="Coming Up" events={later} onSelectEvent={(e, r) => { trackClick(e.id, "view"); setSelectedEvent(e); setSourceRect(r); }} />
        </div>
      )}

      <EventModal event={selectedEvent} sourceRect={sourceRect} onClose={() => { setSelectedEvent(null); setSourceRect(null); }} />
    </div>
  );
}
