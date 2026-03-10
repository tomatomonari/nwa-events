import { NextRequest, NextResponse } from "next/server";
import { fetchLumaEvents, lumaToEvent } from "@/lib/luma";
import { upsertEvents, runSyncWithLogging } from "@/lib/sync";
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
    const result = await runSyncWithLogging("luma", "cron", async () => {
      const lumaEvents = await fetchLumaEvents();
      const events = lumaEvents.map(lumaToEvent);
      return upsertEvents(events);
    });
    await markDuplicatesRecurring();

    return NextResponse.json({
      message: `Synced ${result.synced} events, skipped ${result.skipped}`,
      synced: result.synced,
      skipped: result.skipped,
    });
  } catch (error) {
    console.error("Luma sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
