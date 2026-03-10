import { NextRequest, NextResponse } from "next/server";
import { fetchLumaEvents, fetchLumaTrackedPeopleEvents, lumaToEvent } from "@/lib/luma";
import { fetchMeetupEvents, meetupToEvent } from "@/lib/meetup";
import { fetchEventbriteEvents } from "@/lib/eventbrite";
import { fetchHogSyncEvents, hogsyncToEvent } from "@/lib/hogsync";
import { upsertEvents, runSyncWithLogging } from "@/lib/sync";
import { markDuplicatesRecurring } from "@/lib/recurring";

type Source = "luma" | "luma_people" | "meetup" | "eventbrite" | "hogsync";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

async function syncSource(source: Source) {
  return runSyncWithLogging(source, "manual", async () => {
    switch (source) {
      case "luma": {
        const raw = await fetchLumaEvents();
        return upsertEvents(raw.map(lumaToEvent));
      }
      case "luma_people": {
        const raw = await fetchLumaTrackedPeopleEvents();
        return upsertEvents(raw.map(lumaToEvent));
      }
      case "meetup": {
        const raw = await fetchMeetupEvents();
        const events = raw.map(meetupToEvent).filter((e) => !e.is_online);
        return upsertEvents(events);
      }
      case "eventbrite": {
        const events = await fetchEventbriteEvents();
        return upsertEvents(events);
      }
      case "hogsync": {
        const raw = await fetchHogSyncEvents();
        return upsertEvents(raw.map(hogsyncToEvent));
      }
    }
  });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const requestedSource = body.source as Source | undefined;
    const allSources: Source[] = ["luma", "luma_people", "meetup", "eventbrite", "hogsync"];
    const sources = requestedSource ? [requestedSource] : allSources;

    const results: Record<string, { synced: number; skipped: number } | { error: string }> = {};

    for (const source of sources) {
      try {
        const { synced, skipped } = await syncSource(source);
        results[source] = { synced, skipped };
      } catch (err) {
        console.error(`Sync failed for ${source}:`, err);
        results[source] = { error: String(err) };
      }
    }

    await markDuplicatesRecurring();

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Admin sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
