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

interface MeetupGroup {
  id: string;
  urlname: string;
  name: string | null;
  active: boolean;
  created_at: string;
}

interface HogSyncOrg {
  id: string;
  group_id: string;
  name: string | null;
  active: boolean;
  created_at: string;
}

interface EventbriteOrg {
  id: string;
  organizer_id: string;
  name: string | null;
  active: boolean;
  created_at: string;
}

interface LumaPerson {
  id: string;
  username: string;
  user_api_id: string;
  name: string | null;
  active: boolean;
  created_at: string;
}

interface DiscoverEvent {
  event_id: string;
  event_slug: string;
  title: string;
  start_at: string;
  url: string;
  city: string | null;
  location: string | null;
  calendar_slug: string | null;
  calendar_name: string | null;
  hosts: string[];
  guest_count: number;
  already_imported: boolean;
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
  const [calendarAdding, setCalendarAdding] = useState(false);
  const [calendarMessage, setCalendarMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Sync state
  const [syncLoading, setSyncLoading] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, { synced: number; skipped: number } | { error: string }> | null>(null);

  // Meetup groups state
  const [meetupGroups, setMeetupGroups] = useState<MeetupGroup[]>([]);
  const [meetupUrlname, setMeetupUrlname] = useState("");
  const [meetupName, setMeetupName] = useState("");
  const [meetupLoading, setMeetupLoading] = useState(false);

  // HogSync orgs state
  const [hogsyncOrgs, setHogsyncOrgs] = useState<HogSyncOrg[]>([]);
  const [hogsyncGroupId, setHogsyncGroupId] = useState("");
  const [hogsyncName, setHogsyncName] = useState("");
  const [hogsyncLoading, setHogsyncLoading] = useState(false);

  // Eventbrite orgs state
  const [eventbriteOrgs, setEventbriteOrgs] = useState<EventbriteOrg[]>([]);
  const [eventbriteOrgId, setEventbriteOrgId] = useState("");
  const [eventbriteName, setEventbriteName] = useState("");
  const [eventbriteLoading, setEventbriteLoading] = useState(false);
  const [eventbriteAdding, setEventbriteAdding] = useState(false);
  const [eventbriteMessage, setEventbriteMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Luma people state
  const [lumaPeople, setLumaPeople] = useState<LumaPerson[]>([]);
  const [lumaPersonUsername, setLumaPersonUsername] = useState("");
  const [lumaPersonName, setLumaPersonName] = useState("");
  const [lumaPersonLoading, setLumaPersonLoading] = useState(false);
  const [lumaPersonAdding, setLumaPersonAdding] = useState(false);
  const [lumaPersonMessage, setLumaPersonMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Discover state
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverEvents, setDiscoverEvents] = useState<DiscoverEvent[] | null>(null);
  const [discoverStats, setDiscoverStats] = useState<{ total: number; tracked: number; untracked: number } | null>(null);
  const [importing, setImporting] = useState<Set<string>>(new Set());

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

  const fetchMeetupGroups = useCallback(async () => {
    setMeetupLoading(true);
    try {
      const res = await fetch("/api/admin/meetup-groups", {
        headers: { "x-admin-password": password },
      });
      if (res.ok) {
        const data = await res.json();
        setMeetupGroups(data.groups);
      }
    } finally {
      setMeetupLoading(false);
    }
  }, [password]);

  const fetchHogsyncOrgs = useCallback(async () => {
    setHogsyncLoading(true);
    try {
      const res = await fetch("/api/admin/hogsync-orgs", {
        headers: { "x-admin-password": password },
      });
      if (res.ok) {
        const data = await res.json();
        setHogsyncOrgs(data.orgs);
      }
    } finally {
      setHogsyncLoading(false);
    }
  }, [password]);

  const fetchEventbriteOrgs = useCallback(async () => {
    setEventbriteLoading(true);
    try {
      const res = await fetch("/api/admin/eventbrite-orgs", {
        headers: { "x-admin-password": password },
      });
      if (res.ok) {
        const data = await res.json();
        setEventbriteOrgs(data.orgs);
      }
    } finally {
      setEventbriteLoading(false);
    }
  }, [password]);

  const fetchLumaPeople = useCallback(async () => {
    setLumaPersonLoading(true);
    try {
      const res = await fetch("/api/admin/luma-people", {
        headers: { "x-admin-password": password },
      });
      if (res.ok) {
        const data = await res.json();
        setLumaPeople(data.people);
      }
    } finally {
      setLumaPersonLoading(false);
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

  useEffect(() => {
    if (authenticated) fetchMeetupGroups();
  }, [authenticated, fetchMeetupGroups]);

  useEffect(() => {
    if (authenticated) fetchHogsyncOrgs();
  }, [authenticated, fetchHogsyncOrgs]);

  useEffect(() => {
    if (authenticated) fetchEventbriteOrgs();
  }, [authenticated, fetchEventbriteOrgs]);

  useEffect(() => {
    if (authenticated) fetchLumaPeople();
  }, [authenticated, fetchLumaPeople]);

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
    setCalendarAdding(true);
    setCalendarMessage(null);
    try {
      const res = await fetch("/api/admin/calendars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ slug: calendarSlug, name: calendarName || null }),
      });
      const data = await res.json();
      if (res.ok) {
        const syncInfo = data.sync?.synced ? ` Synced ${data.sync.synced} events.` : "";
        setCalendarMessage({ type: "success", text: `Added "${data.calendar.slug}".${syncInfo}` });
        setCalendarSlug("");
        setCalendarName("");
        fetchCalendars();
      } else {
        setCalendarMessage({ type: "error", text: data.error || "Failed to add calendar" });
      }
    } catch {
      setCalendarMessage({ type: "error", text: "Network error" });
    } finally {
      setCalendarAdding(false);
    }
  }

  async function triggerSync(source?: string) {
    setSyncLoading(source || "all");
    setSyncResults(null);
    try {
      const res = await fetch("/api/admin/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify(source ? { source } : {}),
      });
      if (res.ok) {
        const data = await res.json();
        setSyncResults(data.results);
      } else {
        setSyncResults({ error: { error: "Sync request failed" } } as any);
      }
    } catch {
      setSyncResults({ error: { error: "Network error" } } as any);
    } finally {
      setSyncLoading(null);
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

  async function addMeetupGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!meetupUrlname.trim()) return;
    const res = await fetch("/api/admin/meetup-groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ urlname: meetupUrlname, name: meetupName || null }),
    });
    if (res.ok) {
      setMeetupUrlname("");
      setMeetupName("");
      fetchMeetupGroups();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to add group");
    }
  }

  async function deleteMeetupGroup(id: string) {
    if (!confirm("Remove this Meetup group?")) return;
    await fetch("/api/admin/meetup-groups", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ id }),
    });
    fetchMeetupGroups();
  }

  async function addHogsyncOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!hogsyncGroupId.trim()) return;
    const res = await fetch("/api/admin/hogsync-orgs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ group_id: hogsyncGroupId, name: hogsyncName || null }),
    });
    if (res.ok) {
      setHogsyncGroupId("");
      setHogsyncName("");
      fetchHogsyncOrgs();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to add organization");
    }
  }

  async function deleteHogsyncOrg(id: string) {
    if (!confirm("Remove this HogSync organization?")) return;
    await fetch("/api/admin/hogsync-orgs", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ id }),
    });
    fetchHogsyncOrgs();
  }

  async function addEventbriteOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!eventbriteOrgId.trim()) return;
    setEventbriteAdding(true);
    setEventbriteMessage(null);
    try {
      const res = await fetch("/api/admin/eventbrite-orgs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ organizer_id: eventbriteOrgId, name: eventbriteName || null }),
      });
      const data = await res.json();
      if (res.ok) {
        const syncInfo = data.sync?.synced ? ` Synced ${data.sync.synced} events.` : "";
        setEventbriteMessage({ type: "success", text: `Added "${data.org.organizer_id}".${syncInfo}` });
        setEventbriteOrgId("");
        setEventbriteName("");
        fetchEventbriteOrgs();
      } else {
        setEventbriteMessage({ type: "error", text: data.error || "Failed to add organization" });
      }
    } catch {
      setEventbriteMessage({ type: "error", text: "Network error" });
    } finally {
      setEventbriteAdding(false);
    }
  }

  async function deleteEventbriteOrg(id: string) {
    if (!confirm("Remove this Eventbrite organization?")) return;
    await fetch("/api/admin/eventbrite-orgs", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ id }),
    });
    fetchEventbriteOrgs();
  }

  async function addLumaPerson(e: React.FormEvent) {
    e.preventDefault();
    if (!lumaPersonUsername.trim()) return;
    setLumaPersonAdding(true);
    setLumaPersonMessage(null);
    try {
      const res = await fetch("/api/admin/luma-people", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ username: lumaPersonUsername, name: lumaPersonName || null }),
      });
      const data = await res.json();
      if (res.ok) {
        const syncInfo = data.sync?.synced ? ` Synced ${data.sync.synced} events.` : "";
        setLumaPersonMessage({ type: "success", text: `Added "${data.person.username}".${syncInfo}` });
        setLumaPersonUsername("");
        setLumaPersonName("");
        fetchLumaPeople();
      } else {
        setLumaPersonMessage({ type: "error", text: data.error || "Failed to add person" });
      }
    } catch {
      setLumaPersonMessage({ type: "error", text: "Network error" });
    } finally {
      setLumaPersonAdding(false);
    }
  }

  async function deleteLumaPerson(id: string) {
    if (!confirm("Remove this person?")) return;
    await fetch("/api/admin/luma-people", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ id }),
    });
    fetchLumaPeople();
  }

  async function runDiscover() {
    setDiscoverLoading(true);
    setDiscoverEvents(null);
    setDiscoverStats(null);
    try {
      const res = await fetch("/api/admin/discover-luma", {
        headers: { "x-admin-password": password },
      });
      if (res.ok) {
        const data = await res.json();
        setDiscoverEvents(data.events);
        setDiscoverStats({ total: data.total_discovered, tracked: data.tracked, untracked: data.untracked });
      }
    } catch {
      // ignore
    } finally {
      setDiscoverLoading(false);
    }
  }

  async function importDiscoverEvent(ev: DiscoverEvent) {
    setImporting((prev) => new Set(prev).add(ev.event_id));
    try {
      const res = await fetch("/api/admin/discover-luma", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({ event_slug: ev.event_slug }),
      });
      if (res.ok) {
        // Mark as imported in the list
        setDiscoverEvents((prev) =>
          prev?.map((e) =>
            e.event_id === ev.event_id ? { ...e, already_imported: true } : e
          ) || null
        );
      }
    } catch {
      // ignore
    } finally {
      setImporting((prev) => {
        const next = new Set(prev);
        next.delete(ev.event_id);
        return next;
      });
    }
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

      {/* Sync Now */}
      <div className="mb-8 p-4 rounded-xl border border-border bg-background">
        <h2 className="text-sm font-bold mb-3">Sync Now</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => triggerSync()}
            disabled={!!syncLoading}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {syncLoading === "all" ? "Syncing all..." : "Sync All Sources"}
          </button>
          {(["luma", "luma_people", "meetup", "eventbrite", "hogsync"] as const).map((s) => (
            <button
              key={s}
              onClick={() => triggerSync(s)}
              disabled={!!syncLoading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-muted text-foreground hover:bg-border transition-colors disabled:opacity-50 capitalize"
            >
              {syncLoading === s ? `Syncing ${s}...` : s}
            </button>
          ))}
        </div>
        {syncResults && (
          <div className="mt-3 text-xs space-y-1">
            {Object.entries(syncResults).map(([source, result]) => (
              <div key={source}>
                <span className="font-medium capitalize">{source}:</span>{" "}
                {"error" in result ? (
                  <span className="text-red-600">{result.error}</span>
                ) : (
                  <span className="text-green-700">
                    {result.synced} synced, {result.skipped} skipped
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discover Luma Events */}
      <div className="mb-8 p-4 rounded-xl border border-border bg-background">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold">Discover Luma Events</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Find NWA events not from your tracked calendars. Run locally for best results (uses IP geolocation).</p>
          </div>
          <button
            onClick={runDiscover}
            disabled={discoverLoading}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {discoverLoading ? "Searching..." : "Discover"}
          </button>
        </div>
        {discoverStats && (
          <p className="text-xs text-muted-foreground mb-3">
            Found {discoverStats.total} events nearby — {discoverStats.tracked} from tracked calendars, {discoverStats.untracked} new
          </p>
        )}
        {discoverEvents && discoverEvents.length === 0 && (
          <p className="text-xs text-muted-foreground">No untracked events found.</p>
        )}
        {discoverEvents && discoverEvents.length > 0 && (
          <div className="space-y-2">
            {discoverEvents.map((ev) => (
              <div
                key={ev.event_id}
                className={`p-3 rounded-lg border ${ev.already_imported ? "border-border bg-muted/50" : "border-accent/30 bg-accent-light/30"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <a href={ev.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sm hover:underline">
                      {ev.title}
                    </a>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(ev.start_at), "EEE, MMM d 'at' h:mm a")}
                      {ev.city && ` · ${ev.city}`}
                      {ev.guest_count > 0 && ` · ${ev.guest_count} going`}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {ev.hosts.length > 0 && `Hosts: ${ev.hosts.join(", ")}`}
                      {ev.calendar_slug && ` · Calendar: ${ev.calendar_slug}`}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {ev.already_imported ? (
                      <span className="px-2 py-1 text-xs rounded-lg bg-muted text-muted-foreground">Imported</span>
                    ) : (
                      <>
                        <button
                          onClick={() => importDiscoverEvent(ev)}
                          disabled={importing.has(ev.event_id)}
                          className="px-2 py-1 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors whitespace-nowrap disabled:opacity-50"
                        >
                          {importing.has(ev.event_id) ? "Importing..." : "Import"}
                        </button>
                        {ev.calendar_slug && (
                          <button
                            onClick={() => {
                              setCalendarSlug(ev.calendar_slug!);
                              setCalendarName(ev.calendar_name || "");
                              window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                            }}
                            className="px-2 py-1 text-xs font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors whitespace-nowrap"
                          >
                            Track Calendar
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
        <form onSubmit={addCalendar} className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Slug or Luma URL"
            value={calendarSlug}
            onChange={(e) => setCalendarSlug(e.target.value)}
            disabled={calendarAdding}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
          />
          <input
            type="text"
            placeholder="Display name (optional)"
            value={calendarName}
            onChange={(e) => setCalendarName(e.target.value)}
            disabled={calendarAdding}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={calendarAdding}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {calendarAdding ? "Validating & syncing..." : "Add"}
          </button>
        </form>
        {calendarMessage && (
          <p className={`text-xs mb-4 ${calendarMessage.type === "success" ? "text-green-700" : "text-red-600"}`}>
            {calendarMessage.text}
          </p>
        )}
        {!calendarMessage && <div className="mb-4" />}

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

      {/* Luma People Section */}
      <div className="mt-12 pt-8 border-t border-border">
        <h2 className="text-lg font-bold mb-4">Luma People</h2>

        {/* Add person form */}
        <form onSubmit={addLumaPerson} className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Username or lu.ma/user/... URL"
            value={lumaPersonUsername}
            onChange={(e) => setLumaPersonUsername(e.target.value)}
            disabled={lumaPersonAdding}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
          />
          <input
            type="text"
            placeholder="Display name (optional)"
            value={lumaPersonName}
            onChange={(e) => setLumaPersonName(e.target.value)}
            disabled={lumaPersonAdding}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={lumaPersonAdding}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {lumaPersonAdding ? "Validating & syncing..." : "Add"}
          </button>
        </form>
        {lumaPersonMessage && (
          <p className={`text-xs mb-4 ${lumaPersonMessage.type === "success" ? "text-green-700" : "text-red-600"}`}>
            {lumaPersonMessage.text}
          </p>
        )}
        {!lumaPersonMessage && <div className="mb-4" />}

        {/* People list */}
        {lumaPersonLoading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : lumaPeople.length === 0 ? (
          <p className="text-muted-foreground text-sm">No people tracked.</p>
        ) : (
          <div className="space-y-2">
            {lumaPeople.map((person) => (
              <div
                key={person.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
              >
                <div>
                  <span className="font-medium text-sm">{person.username}</span>
                  {person.name && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({person.name})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteLumaPerson(person.id)}
                  className="px-3 py-1 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Meetup Groups Section */}
      <div className="mt-12 pt-8 border-t border-border">
        <h2 className="text-lg font-bold mb-4">Meetup Groups</h2>

        {/* Add group form */}
        <form onSubmit={addMeetupGroup} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="URL name or Meetup URL"
            value={meetupUrlname}
            onChange={(e) => setMeetupUrlname(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <input
            type="text"
            placeholder="Display name (optional)"
            value={meetupName}
            onChange={(e) => setMeetupName(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
          >
            Add
          </button>
        </form>

        {/* Group list */}
        {meetupLoading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : meetupGroups.length === 0 ? (
          <p className="text-muted-foreground text-sm">No Meetup groups configured.</p>
        ) : (
          <div className="space-y-2">
            {meetupGroups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
              >
                <div>
                  <span className="font-medium text-sm">{group.urlname}</span>
                  {group.name && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({group.name})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteMeetupGroup(group.id)}
                  className="px-3 py-1 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HogSync Organizations Section */}
      <div className="mt-12 pt-8 border-t border-border">
        <h2 className="text-lg font-bold mb-4">HogSync Organizations</h2>

        {/* Add org form */}
        <form onSubmit={addHogsyncOrg} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Group ID or HogSync URL"
            value={hogsyncGroupId}
            onChange={(e) => setHogsyncGroupId(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <input
            type="text"
            placeholder="Display name (optional)"
            value={hogsyncName}
            onChange={(e) => setHogsyncName(e.target.value)}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
          >
            Add
          </button>
        </form>

        {/* Org list */}
        {hogsyncLoading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : hogsyncOrgs.length === 0 ? (
          <p className="text-muted-foreground text-sm">No HogSync organizations configured.</p>
        ) : (
          <div className="space-y-2">
            {hogsyncOrgs.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
              >
                <div>
                  <span className="font-medium text-sm">{org.group_id}</span>
                  {org.name && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({org.name})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteHogsyncOrg(org.id)}
                  className="px-3 py-1 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Eventbrite Organizations Section */}
      <div className="mt-12 pt-8 border-t border-border">
        <h2 className="text-lg font-bold mb-4">Eventbrite Organizations</h2>

        {/* Add org form */}
        <form onSubmit={addEventbriteOrg} className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Organizer ID or Eventbrite URL"
            value={eventbriteOrgId}
            onChange={(e) => setEventbriteOrgId(e.target.value)}
            disabled={eventbriteAdding}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
          />
          <input
            type="text"
            placeholder="Display name (optional)"
            value={eventbriteName}
            onChange={(e) => setEventbriteName(e.target.value)}
            disabled={eventbriteAdding}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={eventbriteAdding}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {eventbriteAdding ? "Validating & syncing..." : "Add"}
          </button>
        </form>
        {eventbriteMessage && (
          <p className={`text-xs mb-4 ${eventbriteMessage.type === "success" ? "text-green-700" : "text-red-600"}`}>
            {eventbriteMessage.text}
          </p>
        )}
        {!eventbriteMessage && <div className="mb-4" />}

        {/* Org list */}
        {eventbriteLoading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : eventbriteOrgs.length === 0 ? (
          <p className="text-muted-foreground text-sm">No Eventbrite organizations configured.</p>
        ) : (
          <div className="space-y-2">
            {eventbriteOrgs.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
              >
                <div>
                  <span className="font-medium text-sm">{org.organizer_id}</span>
                  {org.name && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({org.name})
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteEventbriteOrg(org.id)}
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
