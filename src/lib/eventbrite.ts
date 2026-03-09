import { extractCity } from "./city";
import { extractSignals } from "./signals";
import { getServiceClient } from "./supabase";

const EB_API_BASE = "https://www.eventbriteapi.com/v3";

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

/** Read curated organizer IDs from the eventbrite_orgs table */
async function getOrganizerIds(): Promise<string[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("eventbrite_orgs")
    .select("organizer_id")
    .eq("active", true);

  if (error || !data) return [];
  return data.map((row: { organizer_id: string }) => row.organizer_id);
}

/** Validate an Eventbrite organizer ID by fetching it from the API */
export async function validateOrganizerId(
  organizerId: string
): Promise<{ valid: boolean; name?: string }> {
  const token = process.env.EVENTBRITE_API_KEY;
  if (!token) return { valid: false };

  try {
    const res = await fetch(`${EB_API_BASE}/organizers/${organizerId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { valid: false };
    const data = await res.json();
    return { valid: true, name: data.name || undefined };
  } catch {
    return { valid: false };
  }
}

export async function fetchEventbriteEvents() {
  const token = process.env.EVENTBRITE_API_KEY;
  if (!token) throw new Error("EVENTBRITE_API_KEY not configured");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const organizerIds = await getOrganizerIds();
  if (organizerIds.length === 0) return [];

  const results: any[] = [];

  for (const orgId of organizerIds) {
    try {
      const res = await fetch(
        `${EB_API_BASE}/organizations/${orgId}/events/?status=live&time_filter=current_future&expand=venue,organizer`,
        { headers }
      );

      if (!res.ok) {
        console.error(`Eventbrite org fetch error for "${orgId}": ${res.status}`);
        continue;
      }

      const data = await res.json();
      const events = data?.events || [];

      for (const e of events) {
        const description = (e.description?.text || e.summary || "").slice(0, 2000) || null;

        results.push({
          title: e.name?.text || e.name || "",
          description,
          start_date: e.start?.utc || null,
          end_date: e.end?.utc || null,
          location_name: e.venue?.name || null,
          location_address:
            e.venue?.address?.localized_address_display || null,
          is_online: e.online_event || false,
          online_url: e.online_event ? e.url : null,
          categories: mapCategories(e.tags || []),
          primary_category: "business" as const,
          image_url: e.logo?.url || null,
          source_url: e.url,
          source_platform: "eventbrite",
          source_id: e.id,
          organizer_name: e.organizer?.name || "Unknown",
          organizer_title: null,
          organizer_company: null,
          organizer_avatar_url: null,
          city: extractCity(
            e.venue?.address?.localized_address_display || null,
            e.venue?.name || null
          ),
          signals: extractSignals(description),
          status: "approved",
        });
      }
    } catch (err) {
      console.error(`Failed to fetch Eventbrite events for org "${orgId}":`, err);
    }
  }

  return results;
}
