interface EventbriteVenue {
  name: string | null;
  address?: {
    localized_address_display?: string;
    city?: string;
    region?: string;
  };
}

interface EventbriteEvent {
  id: string;
  name: { text: string };
  description?: { text: string };
  start: { utc: string };
  end?: { utc: string };
  url: string;
  logo?: { url: string } | null;
  venue_id?: string;
  online_event: boolean;
  organizer_id?: string;
}

interface EventbriteOrganizer {
  name: string;
  description?: { text: string };
  logo?: { url: string } | null;
}

const EB_API_BASE = "https://www.eventbriteapi.com/v3";

// NWA-area coordinates (centered around Bentonville)
const NWA_LOCATION = {
  latitude: "36.3729",
  longitude: "-94.2088",
  within: "30mi",
};

export async function fetchEventbriteEvents() {
  const token = process.env.EVENTBRITE_API_KEY;
  if (!token) throw new Error("EVENTBRITE_API_KEY not configured");

  const headers = { Authorization: `Bearer ${token}` };

  // Search for events near NWA
  const params = new URLSearchParams({
    "location.latitude": NWA_LOCATION.latitude,
    "location.longitude": NWA_LOCATION.longitude,
    "location.within": NWA_LOCATION.within,
    "start_date.range_start": new Date().toISOString().split(".")[0] + "Z",
    sort_by: "date",
    expand: "venue,organizer",
  });

  const res = await fetch(`${EB_API_BASE}/events/search/?${params}`, { headers });

  if (!res.ok) {
    console.error(`Eventbrite API error: ${res.status}`);
    return [];
  }

  const data = await res.json();
  return (data.events || []).map((event: EventbriteEvent & { venue?: EventbriteVenue; organizer?: EventbriteOrganizer }) =>
    eventbriteToEvent(event)
  );
}

function eventbriteToEvent(
  event: EventbriteEvent & { venue?: EventbriteVenue; organizer?: EventbriteOrganizer }
) {
  return {
    title: event.name.text,
    description: event.description?.text?.slice(0, 2000) || null,
    start_date: event.start.utc,
    end_date: event.end?.utc || null,
    location_name: event.venue?.name || null,
    location_address: event.venue?.address?.localized_address_display || null,
    is_online: event.online_event,
    online_url: event.online_event ? event.url : null,
    categories: [] as string[],
    image_url: event.logo?.url || null,
    source_url: event.url,
    source_platform: "eventbrite",
    source_id: event.id,
    organizer_name: event.organizer?.name || "Unknown",
    organizer_title: null,
    organizer_company: null,
    organizer_avatar_url: event.organizer?.logo?.url || null,
    status: "approved",
  };
}
