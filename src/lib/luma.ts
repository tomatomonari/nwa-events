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

// NWA-area Luma calendar URLs to sync from
// Format: comma-separated list of Luma calendar slugs (e.g., "onwardfx,StartupJunkie")
const NWA_CALENDARS = (process.env.LUMA_NWA_CALENDARS || "onwardfx,StartupJunkie").split(",");

export async function fetchLumaEvents(): Promise<LumaEventWithHost[]> {
  const results: LumaEventWithHost[] = [];

  for (const calendarSlug of NWA_CALENDARS) {
    try {
      const url = `https://luma.com/${calendarSlug.trim()}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!res.ok) {
        console.error(`Failed to fetch Luma calendar ${calendarSlug}: ${res.status}`);
        continue;
      }

      const html = await res.text();

      // Luma embeds event data in a JSON script tag
      const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
      if (!jsonMatch) {
        console.error(`Could not find event data in Luma page: ${calendarSlug}`);
        continue;
      }

      const pageData = JSON.parse(jsonMatch[1]);
      const pageDataRoot = pageData?.props?.pageProps?.initialData?.data;

      // featured_items is a sibling of calendar, not inside it
      const items = pageDataRoot?.featured_items || [];

      if (items.length === 0) {
        console.error(`No events found in Luma calendar: ${calendarSlug}`);
        continue;
      }

      // Parse events from calendar items
      for (const entry of items) {
        if (entry.event) {
          const event = entry.event as LumaEvent;
          const hosts = (entry.hosts || []) as LumaHost[];
          results.push({ event, hosts });
        }
      }
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

  return {
    title: event.name,
    description: event.description?.slice(0, 2000) || null,
    start_date: event.start_at,
    end_date: event.end_at || null,
    location_name: event.geo_address_json?.full_address?.split(",")[0] || null,
    location_address: event.geo_address_json?.full_address || null,
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
    status: "approved",
  };
}
