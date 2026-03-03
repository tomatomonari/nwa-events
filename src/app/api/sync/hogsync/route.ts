import { NextRequest, NextResponse } from "next/server";
import { fetchHogSyncEvents, hogsyncToEvent } from "@/lib/hogsync";
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
    const hogsyncEvents = await fetchHogSyncEvents();
    const events = hogsyncEvents.map(hogsyncToEvent);
    const { synced, skipped, errors } = await upsertEvents(events);
    await markDuplicatesRecurring();

    return NextResponse.json({
      message: `Synced ${synced} events, skipped ${skipped}`,
      synced,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("HogSync sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
