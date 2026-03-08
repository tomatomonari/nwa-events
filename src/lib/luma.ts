import { extractCity } from "./city";
import { extractSignals } from "./signals";
import { getServiceClient } from "./supabase";

interface LumaEvent {
  api_id: string;
  name: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  geo_address_json?: {
    city?: string;
    full_address?: string;
    place_id?: string;
  } | null;
  geo_address_info?: {
    city?: string;
    address?: string;
    full_address?: string;
    short_address?: string;
    city_state?: string;
    mode?: string;
  } | null;
  geo_latitude?: number | null;
  geo_longitude?: number | null;
  url: string;
  cover_url?: string | null;
  timezone: string;
  location_type?: string;
  meeting_url?: string | null;
}

interface LumaHost {
  name?: string;
  bio?: string;
  avatar_url?: string;
}

export interface LumaEventWithHost {
  event: LumaEvent;
  hosts: LumaHost[];
}

// Fallback calendar slugs if DB table is empty
const FALLBACK_CALENDARS = (process.env.LUMA_NWA_CALENDARS || "onwardfx,StartupJunkie").split(",");

async function getCalendarSlugs(): Promise<string[]> {
  try {
    const supabase = getServiceClient();
    const { data } = await supabase
      .from("luma_calendars")
      .select("slug")
      .eq("active", true);

    if (data && data.length > 0) {
      return data.map((row) => row.slug);
    }
  } catch (err) {
    console.error("Failed to fetch calendar slugs from DB, using fallback:", err);
  }
  return FALLBACK_CALENDARS;
}

export async function fetchLumaCalendarEvents(
  slug: string
): Promise<{ events: LumaEventWithHost[]; calendarName?: string }> {
  const url = `https://luma.com/${slug.trim()}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Luma returned ${res.status} for slug "${slug}"`);
  }

  const html = await res.text();

  const jsonMatch = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s
  );
  if (!jsonMatch) {
    throw new Error(`No __NEXT_DATA__ found for slug "${slug}" — not a valid Luma calendar`);
  }

  const pageData = JSON.parse(jsonMatch[1]);
  const pageDataRoot = pageData?.props?.pageProps?.initialData?.data;

  if (!pageDataRoot?.calendar) {
    throw new Error(`No calendar data found for slug "${slug}" — not a valid Luma calendar`);
  }

  const calendarName = pageDataRoot.calendar.name as string | undefined;
  const items = pageDataRoot.featured_items || [];
  const events: LumaEventWithHost[] = [];

  for (const entry of items) {
    if (entry.event) {
      events.push({
        event: entry.event as LumaEvent,
        hosts: (entry.hosts || []) as LumaHost[],
      });
    }
  }

  return { events, calendarName };
}

export async function validateLumaSlug(
  slug: string
): Promise<{ valid: boolean; calendarName?: string; eventCount: number }> {
  try {
    const { events, calendarName } = await fetchLumaCalendarEvents(slug);
    return { valid: true, calendarName, eventCount: events.length };
  } catch {
    return { valid: false, eventCount: 0 };
  }
}

export async function fetchLumaEvents(): Promise<LumaEventWithHost[]> {
  const results: LumaEventWithHost[] = [];
  const calendarSlugs = await getCalendarSlugs();

  for (const calendarSlug of calendarSlugs) {
    try {
      const { events } = await fetchLumaCalendarEvents(calendarSlug);
      results.push(...events);
    } catch (err) {
      console.error(`Failed to scrape Luma calendar ${calendarSlug}:`, err);
    }
  }

  return results;
}

export function lumaToEvent(item: LumaEventWithHost) {
  const { event, hosts } = item;
  const primaryHost = hosts[0];
  const isOnline = event.location_type === "online" || !!event.meeting_url;

  // Parse organizer title/company from bio
  let organizerTitle: string | null = null;
  let organizerCompany: string | null = null;
  if (primaryHost?.bio) {
    const match = primaryHost.bio.match(/(.+?)\s+(?:at|@)\s+(.+)/i);
    if (match) {
      organizerTitle = match[1].trim();
      organizerCompany = match[2].trim();
    }
  }

  // Prefer geo_address_info (richer), fall back to geo_address_json
  const geo = event.geo_address_info || event.geo_address_json;
  const venueName = event.geo_address_info?.address || null;
  const fullAddress = geo?.full_address || null;
  const locationName = venueName || fullAddress?.split(",")[0] || null;

  return {
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
    organizer_name: primaryHost?.name || "Unknown",
    organizer_title: organizerTitle,
    organizer_company: organizerCompany,
    organizer_avatar_url: primaryHost?.avatar_url || null,
    city: geo?.city
      ? extractCity(geo.city, null)
      : extractCity(fullAddress || null, null),
    signals: extractSignals(event.description),
    status: "approved",
  };
}
