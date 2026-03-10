"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import type { Event } from "@/lib/types";

interface EventsTabProps {
  password: string;
}

export default function EventsTab({ password }: EventsTabProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events?status=${filter}`, {
        headers: { "x-admin-password": password },
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
      }
    } finally {
      setLoading(false);
    }
  }, [filter, password]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  async function updateStatus(eventId: string, status: "approved" | "rejected") {
    await fetch(`/api/events`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ id: eventId, status }),
    });
    fetchEvents();
  }

  async function deleteEvent(eventId: string) {
    if (!confirm("Delete this event?")) return;
    await fetch(`/api/events`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ id: eventId }),
    });
    fetchEvents();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Events</h2>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-full capitalize transition-colors ${
              filter === s
                ? "bg-foreground text-background font-medium"
                : "bg-muted text-muted-foreground hover:bg-border"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-border bg-background animate-pulse">
              <div className="h-4 w-48 bg-muted rounded mb-2" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground">No {filter} events.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="p-4 rounded-xl border border-border bg-background flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{event.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.start_date), "PPp")} &middot;{" "}
                  {event.organizer_name}
                  {event.source_platform && ` \u00b7 via ${event.source_platform}`}
                </p>
                {event.source_url && (
                  <a
                    href={event.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline"
                  >
                    Source
                  </a>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {filter !== "approved" && (
                  <button
                    onClick={() => updateStatus(event.id, "approved")}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                  >
                    Approve
                  </button>
                )}
                {filter !== "rejected" && (
                  <button
                    onClick={() => updateStatus(event.id, "rejected")}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  >
                    Reject
                  </button>
                )}
                <button
                  onClick={() => deleteEvent(event.id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-muted text-muted-foreground hover:bg-border transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
