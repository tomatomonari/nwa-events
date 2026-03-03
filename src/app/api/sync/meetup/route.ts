import { NextRequest, NextResponse } from "next/server";
import { fetchMeetupEvents, meetupToEvent } from "@/lib/meetup";
import { upsertEvents } from "@/lib/sync";
import { markDuplicatesRecurring } from "@/lib/recurring";

export async function GET(req: NextRequest) {
  return handleSync(req);
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

async function handleSync(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const meetupEvents = await fetchMeetupEvents();
    // Skip online-only events before upserting
    const events = meetupEvents
      .map(meetupToEvent)
      .filter((e) => !e.is_online);
    const { synced, skipped, errors } = await upsertEvents(events);
    await markDuplicatesRecurring();

    return NextResponse.json({
      message: `Synced ${synced} events, skipped ${skipped}`,
      synced,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Meetup sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
