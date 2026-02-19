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
    const errors: any[] = [];

    for (const event of events) {
      // Check if event already exists
      const { data: existing } = await supabase
        .from("events")
        .select("id")
        .eq("source_platform", event.source_platform)
        .eq("source_id", event.source_id)
        .maybeSingle();

      let error;
      if (existing) {
        ({ error } = await supabase
          .from("events")
          .update(event)
          .eq("id", existing.id));
      } else {
        ({ error } = await supabase.from("events").insert(event));
      }

      if (error) {
        errors.push({ event_title: event.title, source_id: event.source_id, error });
        skipped++;
      } else {
        synced++;
      }
    }

    return NextResponse.json({
      message: `Synced ${synced} events, skipped ${skipped}`,
      synced,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Eventbrite sync error:", error);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
