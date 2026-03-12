"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import SourceManager from "../SourceManager";

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

interface SourcesTabProps {
  password: string;
}

export default function SourcesTab({ password }: SourcesTabProps) {
  const [syncLoading, setSyncLoading] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, { synced: number; skipped: number } | { error: string }> | null>(null);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [discoverEvents, setDiscoverEvents] = useState<DiscoverEvent[] | null>(null);
  const [discoverStats, setDiscoverStats] = useState<{ total: number; tracked: number; untracked: number } | null>(null);
  const [importing, setImporting] = useState<Set<string>>(new Set());

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
        setDiscoverEvents((prev) =>
          prev?.map((e) =>
            e.event_id === ev.event_id ? { ...e, already_imported: true } : e
          ) || null
        );
      }
    } finally {
      setImporting((prev) => {
        const next = new Set(prev);
        next.delete(ev.event_id);
        return next;
      });
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-bold">Sources</h2>

      {/* Sync Now */}
      <div className="p-4 rounded-xl border border-border bg-background">
        <h3 className="text-sm font-bold mb-3">Sync Now</h3>
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
              {syncLoading === s ? `Syncing ${s}...` : s.replace("_", " ")}
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

      {/* Discover Luma */}
      <div className="p-4 rounded-xl border border-border bg-background">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold">Discover Luma Events</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Find NWA events not from your tracked calendars.</p>
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
                      {ev.city && ` \u00b7 ${ev.city}`}
                      {ev.guest_count > 0 && ` \u00b7 ${ev.guest_count} going`}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {ev.hosts.length > 0 && `Hosts: ${ev.hosts.join(", ")}`}
                      {ev.calendar_slug && ` \u00b7 Calendar: ${ev.calendar_slug}`}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {ev.already_imported ? (
                      <span className="px-2 py-1 text-xs rounded-lg bg-muted text-muted-foreground">Imported</span>
                    ) : (
                      <button
                        onClick={() => importDiscoverEvent(ev)}
                        disabled={importing.has(ev.event_id)}
                        className="px-2 py-1 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors whitespace-nowrap disabled:opacity-50"
                      >
                        {importing.has(ev.event_id) ? "Importing..." : "Import"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Source Managers */}
      <div className="space-y-8">
        <div className="p-4 rounded-xl border border-border bg-background">
          <SourceManager
            title="Luma Calendars"
            apiPath="/api/admin/calendars"
            password={password}
            fields={[
              { key: "slug", label: "Slug", placeholder: "Slug or Luma URL", required: true },
            ]}
            displayKey="slug"
            responseKey="calendars"
            addingLabel="Validating & syncing..."
          />
        </div>

        <div className="p-4 rounded-xl border border-border bg-background">
          <SourceManager
            title="Luma People"
            apiPath="/api/admin/luma-people"
            password={password}
            fields={[
              { key: "username", label: "Username", placeholder: "Username or lu.ma/user/... URL", required: true },
            ]}
            displayKey="username"
            responseKey="people"
            addingLabel="Validating & syncing..."
          />
        </div>

        <div className="p-4 rounded-xl border border-border bg-background">
          <SourceManager
            title="Meetup Groups"
            apiPath="/api/admin/meetup-groups"
            password={password}
            fields={[
              { key: "urlname", label: "URL name", placeholder: "URL name or Meetup URL", required: true },
              { key: "name", label: "Name", placeholder: "Display name (optional)", required: false },
            ]}
            displayKey="urlname"
            responseKey="groups"
          />
        </div>

        <div className="p-4 rounded-xl border border-border bg-background">
          <SourceManager
            title="HogSync Organizations"
            apiPath="/api/admin/hogsync-orgs"
            password={password}
            fields={[
              { key: "group_id", label: "Group ID", placeholder: "Group ID or HogSync URL", required: true },
              { key: "name", label: "Name", placeholder: "Display name (optional)", required: false },
            ]}
            displayKey="group_id"
            responseKey="orgs"
          />
        </div>

        <div className="p-4 rounded-xl border border-border bg-background">
          <SourceManager
            title="Eventbrite Organizations"
            apiPath="/api/admin/eventbrite-orgs"
            password={password}
            fields={[
              { key: "organizer_id", label: "Organizer ID", placeholder: "Organizer ID or Eventbrite URL", required: true },
              { key: "name", label: "Name", placeholder: "Display name (optional)", required: false },
            ]}
            displayKey="organizer_id"
            responseKey="orgs"
            addingLabel="Validating & syncing..."
          />
        </div>
      </div>
    </div>
  );
}
