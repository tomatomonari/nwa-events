"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import type { Event } from "@/lib/types";

interface LumaCalendar {
  id: string;
  slug: string;
  name: string | null;
  active: boolean;
  created_at: string;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [loading, setLoading] = useState(false);

  // Calendars state
  const [calendars, setCalendars] = useState<LumaCalendar[]>([]);
  const [calendarSlug, setCalendarSlug] = useState("");
  const [calendarName, setCalendarName] = useState("");
  const [calendarLoading, setCalendarLoading] = useState(false);

  const fetchCalendars = useCallback(async () => {
    setCalendarLoading(true);
    try {
      const res = await fetch("/api/admin/calendars", {
        headers: { "x-admin-password": password },
      });
      if (res.ok) {
        const data = await res.json();
        setCalendars(data.calendars);
      }
    } finally {
      setCalendarLoading(false);
    }
  }, [password]);

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
    if (authenticated) fetchEvents();
  }, [authenticated, filter, fetchEvents]);

  useEffect(() => {
    if (authenticated) fetchCalendars();
  }, [authenticated, fetchCalendars]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/events?status=pending", {
      headers: { "x-admin-password": password },
    });
    if (res.ok) {
      setAuthenticated(true);
    } else {
      alert("Wrong password");
    }
  }

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

  async function addCalendar(e: React.FormEvent) {
    e.preventDefault();
    if (!calendarSlug.trim()) return;
    const res = await fetch("/api/admin/calendars", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ slug: calendarSlug, name: calendarName || null }),
    });
    if (res.ok) {
      setCalendarSlug("");
      setCalendarName("");
      fetchCalendars();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to add calendar");
    }
  }

  async function deleteCalendar(id: string) {
    if (!confirm("Remove this calendar?")) return;
    await fetch("/api/admin/calendars", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ id }),
    });
    fetchCalendars();
  }

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <h1 className="text-xl font-bold mb-4">Admin</h1>
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <button
            type="submit"
            className="w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
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
        <p className="text-muted-foreground">Loading...</p>
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
                  {event.source_platform && ` &middot; via ${event.source_platform}`}
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

      {/* Luma Calendars Section */}
      <div className="mt-12 pt-8 border-t border-border">
        <h2 className="text-lg font-bold mb-4">Luma Calendars</h2>

        {/* Add calendar form */}
        <form onSubmit={addCalendar} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Slug or Luma URL"
            value={calendarSlug}
            onChange={(e) => setCalendarSlug(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <input
            type="text"
            placeholder="Display name (optional)"
            value={calendarName}
            onChange={(e) => setCalendarName(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
          >
            Add
          </button>
        </form>

        {/* Calendar list */}
        {calendarLoading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : calendars.length === 0 ? (
          <p className="text-muted-foreground text-sm">No calendars configured.</p>
        ) : (
          <div className="space-y-2">
            {calendars.map((cal) => (
              <div
                key={cal.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
              >
                <div>
                  <span className="font-medium text-sm">{cal.slug}</span>
                  {cal.name && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({cal.name})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteCalendar(cal.id)}
                  className="px-3 py-1 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
