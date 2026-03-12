import { extractCity, NWA_CITIES } from "./city";
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

interface LumaCalendar {
  name?: string;
  avatar_url?: string;
}

export interface LumaEventWithHost {
  event: LumaEvent;
  hosts: LumaHost[];
  calendar?: LumaCalendar;
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
  const trimmed = slug.trim();
  const url = trimmed.startsWith("cal-")
    ? `https://luma.com/calendar/${trimmed}`
    : `https://luma.com/${trimmed}`;
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
  // /calendar/cal-xxx pages put data at initialData directly, slug pages nest under initialData.data
  const pageDataRoot =
    pageData?.props?.pageProps?.initialData?.data ??
    pageData?.props?.pageProps?.initialData;

  if (!pageDataRoot?.calendar) {
    throw new Error(`No calendar data found for slug "${slug}" — not a valid Luma calendar`);
  }

  const calendar: LumaCalendar = {
    name: pageDataRoot.calendar.name,
    avatar_url: pageDataRoot.calendar.avatar_url,
  };
  const calendarName = calendar.name;
  const items = pageDataRoot.featured_items || [];
  const events: LumaEventWithHost[] = [];

  for (const entry of items) {
    if (entry.event) {
      events.push({
        event: entry.event as LumaEvent,
        hosts: (entry.hosts || []) as LumaHost[],
        calendar,
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
      for (const item of events) {
        const city =
          item.event.geo_address_info?.city ||
          item.event.geo_address_json?.city;
        if (!isNwaCity(city)) continue;
        results.push(item);
      }
    } catch (err) {
      console.error(`Failed to scrape Luma calendar ${calendarSlug}:`, err);
    }
  }

  return results;
}

// NWA city filter for calendar and discover API results
function isNwaCity(cityStr: string | undefined | null): boolean {
  if (!cityStr) return false;
  const lower = cityStr.toLowerCase();
  return NWA_CITIES.some((c) => lower.includes(c.toLowerCase()));
}

export async function validateLumaUsername(
  username: string
): Promise<{ valid: boolean; name?: string; userApiId?: string }> {
  try {
    const url = `https://lu.ma/user/${username.trim()}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) return { valid: false };

    const html = await res.text();
    const jsonMatch = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s
    );
    if (!jsonMatch) return { valid: false };

    const pageData = JSON.parse(jsonMatch[1]);
    const initialData = pageData?.props?.pageProps?.initialData;
    const userData = initialData?.data?.user || initialData?.user;
    if (!userData?.api_id) return { valid: false };

    return {
      valid: true,
      name: userData.name || userData.username || username,
      userApiId: userData.api_id,
    };
  } catch {
    return { valid: false };
  }
}

export async function fetchLumaPersonEvents(
  userApiId: string,
  personName?: string
): Promise<LumaEventWithHost[]> {
  const results: LumaEventWithHost[] = [];
  let cursor: string | null = null;
  const nameLower = personName?.toLowerCase();

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const params = new URLSearchParams({
      user_api_id: userApiId,
      pagination_limit: "50",
    });
    if (cursor) params.set("pagination_cursor", cursor);

    const url = `https://api.lu.ma/discover/get-paginated-events?${params}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) break;

    const data = await res.json();
    const entries = data?.entries || [];
    if (entries.length === 0) break;

    for (const entry of entries) {
      const event = entry.event as LumaEvent | undefined;
      if (!event) continue;

      // Filter to NWA cities
      const city =
        event.geo_address_info?.city || event.geo_address_json?.city;
      if (!isNwaCity(city)) continue;

      // The discover API returns all nearby events, not just hosted ones.
      // Filter to events where this person is actually a host.
      if (nameLower) {
        const hosts = (entry.hosts || []) as LumaHost[];
        const isHost = hosts.some(
          (h) => h.name && h.name.toLowerCase() === nameLower
        );
        if (!isHost) continue;
      }

      results.push({
        event,
        hosts: (entry.hosts || []) as LumaHost[],
        calendar: entry.calendar
          ? {
              name: entry.calendar.name,
              avatar_url: entry.calendar.avatar_url,
            }
          : undefined,
      });
    }

    if (!data.has_more) break;
    cursor = data.next_cursor;
  }

  return results;
}

export async function fetchLumaTrackedPeopleEvents(): Promise<
  LumaEventWithHost[]
> {
  const supabase = getServiceClient();
  const { data: people } = await supabase
    .from("luma_people")
    .select("user_api_id, username, name")
    .eq("active", true);

  if (!people || people.length === 0) return [];

  const results: LumaEventWithHost[] = [];
  for (const person of people) {
    try {
      const events = await fetchLumaPersonEvents(
        person.user_api_id,
        person.name || undefined
      );
      results.push(...events);
    } catch (err) {
      console.error(
        `Failed to fetch events for Luma person ${person.username}:`,
        err
      );
    }
  }

  return results;
}

export async function fetchLumaEventByUrl(
  eventUrl: string
): Promise<LumaEventWithHost> {
  // Normalize URL — accept lu.ma or luma.com links
  let url = eventUrl.trim();
  if (!url.startsWith("http")) url = `https://${url}`;
  url = url.replace("lu.ma/", "luma.com/");

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Luma returned ${res.status} for "${eventUrl}"`);
  }

  const html = await res.text();

  const jsonMatch = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s
  );
  if (!jsonMatch) {
    throw new Error("No __NEXT_DATA__ found — not a valid Luma event page");
  }

  const pageData = JSON.parse(jsonMatch[1]);
  const root =
    pageData?.props?.pageProps?.initialData?.data ??
    pageData?.props?.pageProps?.initialData;

  const event = root?.event as LumaEvent | undefined;
  if (!event) {
    throw new Error("No event data found on page — may not be an event URL");
  }

  const hosts = (root?.hosts?.map((h: any) => ({
    name: h.name,
    bio: h.bio,
    avatar_url: h.avatar_url,
  })) || []) as LumaHost[];

  const calendar: LumaCalendar | undefined = root?.calendar
    ? { name: root.calendar.name, avatar_url: root.calendar.avatar_url }
    : undefined;

  return { event, hosts, calendar };
}

export function lumaToEvent(item: LumaEventWithHost) {
  const { event, hosts, calendar } = item;
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

  // Use calendar (org) name as organizer, individual hosts as hosts array
  const orgName = calendar?.name || primaryHost?.name || "Unknown";
  const hostNames = hosts
    .map((h) => h.name)
    .filter((name): name is string =>
      !!name && name.toLowerCase() !== orgName.toLowerCase()
    );

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
    organizer_name: orgName,
    organizer_title: organizerTitle,
    organizer_company: organizerCompany,
    organizer_avatar_url: calendar?.avatar_url || primaryHost?.avatar_url || null,
    city: geo?.city
      ? extractCity(geo.city, null)
      : extractCity(fullAddress || null, null),
    signals: extractSignals(event.description),
    hosts: hostNames,
    status: "approved",
  };
}
