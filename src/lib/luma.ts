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

const LUMA_API_BASE = "https://api.lu.ma/public/v1";

// NWA-area calendar/community IDs to sync from
// These need to be configured with real Luma calendar IDs
const NWA_CALENDARS = process.env.LUMA_NWA_CALENDARS?.split(",") || [];

export async function fetchLumaEvents(): Promise<LumaEventWithHost[]> {
  const apiKey = process.env.LUMA_API_KEY;
  if (!apiKey) throw new Error("LUMA_API_KEY not configured");

  const results: LumaEventWithHost[] = [];

  for (const calendarId of NWA_CALENDARS) {
    try {
      const res = await fetch(
        `${LUMA_API_BASE}/calendar/get-items?calendar_api_id=${calendarId.trim()}`,
        {
          headers: { "x-luma-api-key": apiKey },
        }
      );

      if (!res.ok) {
        console.error(`Luma API error for calendar ${calendarId}: ${res.status}`);
        continue;
      }

      const data = await res.json();

      if (data.entries) {
        for (const entry of data.entries) {
          const event = entry.event as LumaEvent;
          const hosts = (entry.hosts || []) as LumaHost[];
          results.push({ event, hosts });
        }
      }
    } catch (err) {
      console.error(`Failed to fetch Luma calendar ${calendarId}:`, err);
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
