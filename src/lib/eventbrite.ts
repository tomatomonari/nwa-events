const EB_API_BASE = "https://www.eventbriteapi.com/v3";

// NWA cities to search for events
const NWA_QUERIES = [
  "Bentonville Arkansas",
  "Fayetteville Arkansas",
  "Rogers Arkansas",
  "Springdale Arkansas",
];

// Map Eventbrite tags to our categories
function mapCategories(tags: any[]): string[] {
  const categoryMap: Record<string, string> = {
    "Business & Professional": "networking",
    "Science & Technology": "tech",
    "Community & Culture": "community",
    "Education": "education",
    "Career": "career",
    "Startups & Small Business": "startup",
    "Food & Drink": "community",
    "Music": "community",
    "Charity & Causes": "community",
  };

  const categories: string[] = [];
  for (const tag of tags || []) {
    if (tag.prefix === "EventbriteCategory" && tag.display_name) {
      const mapped = categoryMap[tag.display_name];
      if (mapped && !categories.includes(mapped)) {
        categories.push(mapped);
      }
    }
  }
  return categories.length > 0 ? categories : ["other"];
}

function toISO(date: string, time: string, timezone: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

export async function fetchEventbriteEvents() {
  const token = process.env.EVENTBRITE_API_KEY;
  if (!token) throw new Error("EVENTBRITE_API_KEY not configured");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const seenIds = new Set<string>();
  const results: any[] = [];

  for (const query of NWA_QUERIES) {
    try {
      const res = await fetch(`${EB_API_BASE}/destination/search/`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          event_search: {
            dates: "current_future",
            dedup: true,
            q: query,
            page: 1,
            page_size: 20,
          },
          "expand.destination_event": [
            "primary_venue",
            "image",
            "primary_organizer",
          ],
        }),
      });

      if (!res.ok) {
        console.error(`Eventbrite search error for "${query}": ${res.status}`);
        continue;
      }

      const data = await res.json();
      const events = data?.events?.results || [];

      for (const e of events) {
        // Dedupe across queries
        if (seenIds.has(e.id)) continue;
        seenIds.add(e.id);

        results.push({
          title: e.name,
          description: (e.summary || e.full_description || "").slice(0, 2000) || null,
          start_date: toISO(e.start_date, e.start_time, e.timezone),
          end_date: e.end_date && e.end_time
            ? toISO(e.end_date, e.end_time, e.timezone)
            : null,
          location_name: e.primary_venue?.name || null,
          location_address:
            e.primary_venue?.address?.localized_address_display || null,
          is_online: e.is_online_event || false,
          online_url: e.is_online_event ? e.url : null,
          categories: mapCategories(e.tags),
          image_url: e.image?.url || null,
          source_url: e.url,
          source_platform: "eventbrite",
          source_id: e.id,
          organizer_name: e.primary_organizer?.name || "Unknown",
          organizer_title: null,
          organizer_company: null,
          organizer_avatar_url: null,
          status: "approved",
        });
      }
    } catch (err) {
      console.error(`Failed to fetch Eventbrite events for "${query}":`, err);
    }
  }

  return results;
}
