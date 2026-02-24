import { extractCity } from "./city";
import { extractSignals } from "./signals";
import { getServiceClient } from "./supabase";

interface MeetupVenue {
  name: string;
  address?: string;
  city?: string;
  state?: string;
}

interface MeetupEvent {
  id: string;
  title: string;
  description: string | null;
  eventUrl: string;
  dateTime: string;
  endTime: string | null;
  venue: MeetupVenue | null;
  groupName: string;
  going: number;
  imageUrl: string | null;
}

// Fallback groups if DB table is empty
const FALLBACK_GROUPS = (
  process.env.MEETUP_NWA_GROUPS || "nwa-techfest,northwest-arkansas-developers-group"
).split(",");

async function getGroupUrlnames(): Promise<string[]> {
  try {
    const supabase = getServiceClient();
    const { data } = await supabase
      .from("meetup_groups")
      .select("urlname")
      .eq("active", true);

    if (data && data.length > 0) {
      return data.map((row) => row.urlname);
    }
  } catch (err) {
    console.error("Failed to fetch meetup groups from DB, using fallback:", err);
  }
  return FALLBACK_GROUPS;
}

function resolveRef(apolloState: Record<string, any>, ref: any): any {
  if (ref && typeof ref === "object" && ref.__ref) {
    return apolloState[ref.__ref] || null;
  }
  return ref || null;
}

function parseApolloEvents(html: string, groupUrlname: string): MeetupEvent[] {
  const jsonMatch = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s
  );
  if (!jsonMatch) {
    console.error(`Could not find __NEXT_DATA__ in Meetup page: ${groupUrlname}`);
    return [];
  }

  const pageData = JSON.parse(jsonMatch[1]);
  const apolloState: Record<string, any> =
    pageData?.props?.pageProps?.__APOLLO_STATE__;
  if (!apolloState) {
    console.error(`No Apollo state found for Meetup group: ${groupUrlname}`);
    return [];
  }

  const events: MeetupEvent[] = [];

  // Find the Group object to get group name
  let groupName = groupUrlname;
  for (const key of Object.keys(apolloState)) {
    if (key.startsWith("Group:") && apolloState[key].urlname === groupUrlname) {
      groupName = apolloState[key].name || groupUrlname;
      break;
    }
  }

  // Find all Event objects in Apollo state
  for (const key of Object.keys(apolloState)) {
    if (!key.startsWith("Event:")) continue;

    const node = apolloState[key];
    // Only include upcoming/active events
    if (node.status && node.status !== "ACTIVE" && node.status !== "UPCOMING") continue;

    // Resolve venue ref
    let venue: MeetupVenue | null = null;
    if (node.venue) {
      const venueData = resolveRef(apolloState, node.venue);
      if (venueData) {
        venue = {
          name: venueData.name || "",
          address: venueData.address || undefined,
          city: venueData.city || undefined,
          state: venueData.state || undefined,
        };
      }
    }

    // Resolve photo ref
    let imageUrl: string | null = null;
    if (node.featuredEventPhoto) {
      const photo = resolveRef(apolloState, node.featuredEventPhoto);
      if (photo) {
        imageUrl = photo.highResUrl || photo.baseUrl || null;
      }
    }

    // Going count
    const going =
      typeof node.going === "object" && node.going?.totalCount
        ? node.going.totalCount
        : typeof node.going === "number"
          ? node.going
          : 0;

    events.push({
      id: node.id,
      title: node.title,
      description: node.description || null,
      eventUrl: node.eventUrl || `https://www.meetup.com/${groupUrlname}/events/${node.id}/`,
      dateTime: node.dateTime,
      endTime: node.endTime || null,
      venue,
      groupName,
      going,
      imageUrl,
    });
  }

  return events;
}

export async function fetchMeetupEvents(): Promise<MeetupEvent[]> {
  const results: MeetupEvent[] = [];
  const groupUrlnames = await getGroupUrlnames();

  for (const urlname of groupUrlnames) {
    try {
      const url = `https://www.meetup.com/${urlname.trim()}/events/`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!res.ok) {
        console.error(`Failed to fetch Meetup group ${urlname}: ${res.status}`);
        continue;
      }

      const html = await res.text();
      const events = parseApolloEvents(html, urlname.trim());
      results.push(...events);
    } catch (err) {
      console.error(`Failed to scrape Meetup group ${urlname}:`, err);
    }
  }

  return results;
}

export function meetupToEvent(item: MeetupEvent) {
  const isOnline =
    !item.venue ||
    item.venue.name?.toLowerCase() === "online event" ||
    !item.venue.address;

  const venueAddress =
    item.venue && !isOnline
      ? [item.venue.address, item.venue.city, item.venue.state]
          .filter(Boolean)
          .join(", ")
      : null;

  return {
    title: item.title,
    description: item.description?.slice(0, 2000) || null,
    start_date: item.dateTime,
    end_date: item.endTime || null,
    location_name: !isOnline ? item.venue?.name || null : null,
    location_address: venueAddress,
    is_online: isOnline,
    online_url: isOnline ? item.eventUrl : null,
    categories: [] as string[],
    primary_category: "business" as const,
    image_url: item.imageUrl,
    source_url: item.eventUrl,
    source_platform: "meetup",
    source_id: item.id,
    organizer_name: item.groupName,
    organizer_title: null,
    organizer_company: null,
    organizer_avatar_url: null,
    city: item.venue?.city
      ? extractCity(item.venue.city, null)
      : extractCity(venueAddress, null),
    signals: extractSignals(item.description),
    status: "approved",
  };
}
