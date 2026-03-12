import { NextRequest, NextResponse } from "next/server";
import { fetchLumaEventByUrl, lumaToEvent } from "@/lib/luma";
import { parseEventFromURL } from "@/lib/url-parser";
import { upsertEvents } from "@/lib/sync";
import { markDuplicatesRecurring } from "@/lib/recurring";
import { extractSignals } from "@/lib/signals";
import { extractCity } from "@/lib/city";
import { getServiceClient } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

function isLumaUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes("luma.com/") || lower.includes("lu.ma/");
}

/** Convert Gemini-parsed event to our DB event shape */
function parsedToEvent(parsed: Awaited<ReturnType<typeof parseEventFromURL>>, url: string) {
  return {
    title: parsed.title,
    description: parsed.description,
    start_date: parsed.start_date,
    end_date: parsed.end_date,
    location_name: parsed.location_name,
    location_address: parsed.location_address,
    organizer_name: parsed.organizer_name,
    organizer_title: parsed.organizer_title,
    organizer_company: parsed.organizer_company,
    image_url: parsed.image_url,
    source_platform: "web" as const,
    source_id: `web-${Buffer.from(url).toString("base64url").slice(0, 40)}`,
    source_url: url,
    primary_category: parsed.primary_category || "business",
    categories: parsed.categories || [],
    city: parsed.location_address
      ? extractCity(parsed.location_address, parsed.location_name)
      : null,
    is_online: parsed.is_online || false,
    online_url: parsed.online_url,
    status: "approved",
    signals: extractSignals(parsed.description),
    hosts: parsed.organizer_name ? [parsed.organizer_name] : [],
  };
}

/** Build an event record from manual form data */
function manualToEvent(data: {
  title: string;
  start_date: string;
  end_date?: string | null;
  location_name?: string | null;
  location_address?: string | null;
  organizer_name: string;
  description?: string | null;
  source_url?: string | null;
}) {
  const sourceId = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    title: data.title,
    description: data.description || null,
    start_date: data.start_date,
    end_date: data.end_date || null,
    location_name: data.location_name || null,
    location_address: data.location_address || null,
    organizer_name: data.organizer_name,
    source_platform: "manual",
    source_id: sourceId,
    source_url: data.source_url || null,
    primary_category: "business",
    categories: [],
    city: extractCity(data.location_address || null, data.location_name || null),
    is_online: false,
    status: "approved",
    signals: extractSignals(data.description || null),
    hosts: data.organizer_name ? [data.organizer_name] : [],
  };
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { url, confirm, recurring, event: manualEvent, events: manualEvents } = body;

    // --- Bulk manual create mode (recurring batch) ---
    if (Array.isArray(manualEvents) && manualEvents.length > 0) {
      for (const ev of manualEvents) {
        if (!ev.title || !ev.start_date || !ev.organizer_name) {
          return NextResponse.json(
            { error: "Each event must have title, start date, and organizer name" },
            { status: 400 }
          );
        }
      }

      const events = manualEvents.map((ev: Parameters<typeof manualToEvent>[0]) =>
        manualToEvent(ev)
      );
      const result = await upsertEvents(events);
      await markDuplicatesRecurring();

      // Force recurring=true on all created events
      if (recurring) {
        const supabase = getServiceClient();
        const sourceIds = events.map((e) => e.source_id);
        await supabase
          .from("events")
          .update({ recurring: true })
          .in("source_id", sourceIds);
      }

      return NextResponse.json({ imported: true, count: events.length, ...result });
    }

    // --- Single manual create mode ---
    if (manualEvent) {
      if (!manualEvent.title || !manualEvent.start_date || !manualEvent.organizer_name) {
        return NextResponse.json(
          { error: "Title, start date, and organizer name are required" },
          { status: 400 }
        );
      }

      const event = manualToEvent(manualEvent);
      const result = await upsertEvents([event]);
      await markDuplicatesRecurring();

      // Override recurring if explicitly set
      if (recurring) {
        const supabase = getServiceClient();
        await supabase
          .from("events")
          .update({ recurring: true })
          .eq("source_id", event.source_id);
      }

      return NextResponse.json({ imported: true, event, ...result });
    }

    // --- URL import mode ---
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL or event data is required" }, { status: 400 });
    }

    let event: Record<string, any>;

    if (isLumaUrl(url)) {
      // Structured Luma scraping
      const raw = await fetchLumaEventByUrl(url);
      event = lumaToEvent(raw);
    } else {
      // Gemini AI fallback for any URL
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
      }

      const res = await fetch(parsedUrl.toString(), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; NWAEvents/1.0; +https://nwa.events)",
        },
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: `Failed to fetch URL (${res.status})` },
          { status: 422 }
        );
      }

      const html = await res.text();
      const parsed = await parseEventFromURL(url, html);
      event = parsedToEvent(parsed, url);
    }

    if (confirm) {
      const result = await upsertEvents([event]);
      await markDuplicatesRecurring();

      // Override recurring if explicitly set
      if (recurring) {
        const supabase = getServiceClient();
        await supabase
          .from("events")
          .update({ recurring: true })
          .eq("source_id", event.source_id);
      }

      return NextResponse.json({ imported: true, event, ...result });
    }

    // Preview mode
    return NextResponse.json({ preview: true, event });
  } catch (error) {
    console.error("Import event error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}
