import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { fetchEventbriteEvents } from "@/lib/eventbrite";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const events = await fetchEventbriteEvents();
    const supabase = getServiceClient();

    let synced = 0;
    let skipped = 0;

    for (const event of events) {
      const { error } = await supabase.from("events").upsert(event, {
        onConflict: "source_platform,source_id",
        ignoreDuplicates: false,
      });

      if (error) {
        console.error(`Failed to upsert EB event ${event.source_id}:`, error);
        skipped++;
      } else {
        synced++;
      }
    }

    return NextResponse.json({
      message: `Synced ${synced} events, skipped ${skipped}`,
      synced,
      skipped,
    });
  } catch (error) {
    console.error("Eventbrite sync error:", error);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
