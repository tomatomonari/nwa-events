import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { upsertEvents } from "@/lib/sync";
import { extractCity } from "@/lib/city";
import { extractSignals } from "@/lib/signals";
import { markDuplicatesRecurring } from "@/lib/recurring";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

interface DiscoverEntry {
  event: {
    api_id: string;
    name: string;
    start_at: string;
    end_at: string | null;
    url: string;
    cover_url?: string | null;
    location_type?: string;
    meeting_url?: string | null;
    geo_address_info?: {
      city?: string;
      full_address?: string;
      address?: string;
    } | null;
  };
  calendar: {
    slug: string | null;
    name: string | null;
    api_id: string;
  };
  hosts: { name: string; username?: string; avatar_url?: string; bio_short?: string }[];
  guest_count?: number;
}

/** Scrape a single Luma event page for full details (description, hosts, etc.) */
async function fetchSingleLumaEvent(eventSlug: string) {
  const res = await fetch(`https://luma.com/${eventSlug}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`Luma returned ${res.status}`);

  const html = await res.text();
  const jsonMatch = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s
  );
  if (!jsonMatch) throw new Error("No __NEXT_DATA__ found");

  const pageData = JSON.parse(jsonMatch[1]);
  const root = pageData?.props?.pageProps?.initialData?.data;
  if (!root?.event) throw new Error("No event data found");

  return {
    event: root.event,
    hosts: (root.hosts || []) as { name?: string; avatar_url?: string; bio_short?: string }[],
    calendar: root.calendar || null,
  };
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all events from Luma discover (uses IP geolocation — works from NWA)
    const entries: DiscoverEntry[] = [];
    let cursor: string | null = null;
    let hasMore = true;

    while (hasMore) {
      const url = new URL("https://api.lu.ma/discover/get-paginated-events");
      url.searchParams.set("pagination_limit", "50");
      if (cursor) url.searchParams.set("pagination_cursor", cursor);

      const res = await fetch(url.toString());
      if (!res.ok) break;

      const data = await res.json();
      entries.push(...(data.entries || []));
      hasMore = data.has_more || false;
      cursor = data.next_cursor || null;
    }

    // Get tracked calendar slugs from DB
    const supabase = getServiceClient();
    const { data: calendars } = await supabase
      .from("luma_calendars")
      .select("slug")
      .eq("active", true);

    const trackedSlugs = new Set(
      (calendars || []).map((c: { slug: string }) => c.slug.toLowerCase())
    );

    // Get existing luma event source_ids
    const { data: existingEvents } = await supabase
      .from("events")
      .select("source_id")
      .eq("source_platform", "luma");

    const existingIds = new Set(
      (existingEvents || []).map((e: { source_id: string }) => e.source_id)
    );

    // Split into tracked vs untracked
    const untracked = entries
      .filter((entry) => {
        const slug = entry.calendar?.slug;
        // Untracked = no calendar slug (personal) or slug not in our list
        if (!slug) return true;
        return !trackedSlugs.has(slug.toLowerCase());
      })
      .map((entry) => ({
        event_id: entry.event.api_id,
        event_slug: entry.event.url,
        title: entry.event.name,
        start_at: entry.event.start_at,
        url: `https://lu.ma/${entry.event.url}`,
        city: entry.event.geo_address_info?.city || null,
        location: entry.event.geo_address_info?.address || null,
        calendar_slug: entry.calendar?.slug || null,
        calendar_name: entry.calendar?.name || null,
        hosts: entry.hosts.map((h) => h.name),
        guest_count: entry.guest_count || 0,
        already_imported: existingIds.has(entry.event.api_id),
      }));

    return NextResponse.json({
      total_discovered: entries.length,
      tracked: entries.length - untracked.length,
      untracked: untracked.length,
      events: untracked,
    });
  } catch (error) {
    console.error("Luma discover error:", error);
    return NextResponse.json({ error: "Discovery failed" }, { status: 500 });
  }
}

// POST /api/admin/discover-luma — import a single discovered event by its slug
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const eventSlug = body.event_slug;
  if (!eventSlug) {
    return NextResponse.json({ error: "event_slug is required" }, { status: 400 });
  }

  try {
    const { event, hosts, calendar } = await fetchSingleLumaEvent(eventSlug);

    const primaryHost = hosts[0];
    const isOnline = event.location_type === "online" || !!event.meeting_url;
    const geo = event.geo_address_info || event.geo_address_json;
    const venueName = event.geo_address_info?.address || null;
    const fullAddress = geo?.full_address || null;
    const locationName = venueName || fullAddress?.split(",")[0] || null;

    const orgName = calendar?.name && calendar.name !== "Personal"
      ? calendar.name
      : primaryHost?.name || "Unknown";

    const hostNames = hosts
      .map((h: { name?: string }) => h.name)
      .filter((name: string | undefined): name is string =>
        !!name && name.toLowerCase() !== orgName.toLowerCase()
      );

    const eventData = {
      title: event.name,
      description: event.description?.slice(0, 2000) || null,
      start_date: event.start_at,
      end_date: event.end_at || null,
      location_name: locationName,
      location_address: fullAddress,
      is_online: isOnline,
      online_url: event.meeting_url || null,
      categories: [] as string[],
      primary_category: "business" as const,
      image_url: event.cover_url || null,
      source_url: `https://lu.ma/${event.url}`,
      source_platform: "luma",
      source_id: event.api_id,
      organizer_name: orgName,
      organizer_title: null,
      organizer_company: null,
      organizer_avatar_url: calendar?.avatar_url || primaryHost?.avatar_url || null,
      city: geo?.city
        ? extractCity(geo.city, null)
        : extractCity(fullAddress || null, null),
      signals: extractSignals(event.description),
      hosts: hostNames,
      status: "approved",
    };

    const result = await upsertEvents([eventData]);
    await markDuplicatesRecurring();

    return NextResponse.json({
      success: true,
      title: event.name,
      synced: result.synced,
    });
  } catch (error) {
    console.error("Failed to import Luma event:", error);
    return NextResponse.json(
      { error: `Import failed: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
