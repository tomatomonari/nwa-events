"use client";

import { useState, useMemo } from "react";
import { isToday, isThisWeek, isAfter, endOfWeek } from "date-fns";
import type { Event } from "@/lib/types";
import EventCard from "./EventCard";
import CategoryFilter from "./CategoryFilter";

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

function EventGroup({ title, events }: { title: string; events: Event[] }) {
  if (events.length === 0) return null;
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

export default function EventList({ events }: EventListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!selectedCategory) return events;
    return events.filter((e) => e.categories.includes(selectedCategory));
  }, [events, selectedCategory]);

  const { today, thisWeek, later } = useMemo(() => groupEvents(filtered), [filtered]);

  return (
    <div>
      <div className="mb-8">
        <CategoryFilter selected={selectedCategory} onChange={setSelectedCategory} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No events found.</p>
        </div>
      ) : (
        <div className="space-y-10">
          <EventGroup title="Today" events={today} />
          <EventGroup title="This Week" events={thisWeek} />
          <EventGroup title="Coming Up" events={later} />
        </div>
      )}
    </div>
  );
}
