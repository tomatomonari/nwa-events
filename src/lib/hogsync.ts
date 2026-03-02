import { extractCity } from "./city";
import { extractSignals } from "./signals";
import { getServiceClient } from "./supabase";

interface HogSyncRawEvent {
  p0: string; // "true" for date separators
  p1: string; // event ID
  p3: string; // event name
  p4: string; // dates string e.g. "\n\nThu, Mar 5, 2026\n\n8:30 AM – 9:30 AM\n\n"
  p5: string; // category
  p6: string; // location
  p7: string; // group ID
  p9: string; // organization name
  p11: string; // image path (relative)
  p12: string; // price ("FREE" or empty)
  p18: string; // RSVP URL path
  p28: string; // timezone e.g. "CDT (GMT-5)"
  [key: string]: string;
}

export interface HogSyncEvent {
  id: string;
  name: string;
  startDate: string; // ISO string
  endDate: string | null;
  location: string;
  organizationName: string;
  imageUrl: string | null;
  sourceUrl: string;
  category: string;
}

// Fallback group IDs if DB table is empty
const FALLBACK_GROUPS = (
  process.env.HOGSYNC_GROUP_IDS || "35807"
).split(",");

async function getGroupIds(): Promise<string[]> {
  try {
    const supabase = getServiceClient();
    const { data } = await supabase
      .from("hogsync_orgs")
      .select("group_id")
      .eq("active", true);

    if (data && data.length > 0) {
      return data.map((row) => row.group_id);
    }
  } catch (err) {
    console.error("Failed to fetch hogsync orgs from DB, using fallback:", err);
  }
  return FALLBACK_GROUPS;
}

/**
 * Parse the p4 date string and p28 timezone into ISO date strings.
 * p4 format: "\n\nThu, Mar 5, 2026\n\n8:30 AM – 9:30 AM\n\n"
 * p28 format: "CDT (GMT-5)" or "CST (GMT-6)"
 */
function parseDates(p4: string, p28: string): { start: string; end: string | null } {
  const cleaned = p4.replace(/\n/g, " ").trim();

  // Extract date part: "Thu, Mar 5, 2026" and time part: "8:30 AM – 9:30 AM"
  // Pattern: day-of-week, Month Day, Year  then  time range
  const dateMatch = cleaned.match(
    /\w+,\s+(\w+\s+\d{1,2},\s+\d{4})\s+([\d:]+\s*[AP]M)\s*[–-]\s*([\d:]+\s*[AP]M)/i
  );

  if (!dateMatch) {
    // Try date-only (all-day event)
    const dateOnlyMatch = cleaned.match(/\w+,\s+(\w+\s+\d{1,2},\s+\d{4})/);
    if (dateOnlyMatch) {
      const dateStr = dateOnlyMatch[1];
      const d = new Date(`${dateStr} 00:00:00`);
      if (!isNaN(d.getTime())) {
        return { start: d.toISOString(), end: null };
      }
    }
    // Fallback: try parsing the whole string
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) {
      return { start: d.toISOString(), end: null };
    }
    return { start: new Date().toISOString(), end: null };
  }

  const [, datePart, startTime, endTime] = dateMatch;

  // Parse GMT offset from p28: "CDT (GMT-5)" -> -5
  let offsetHours = -6; // default to CST
  const offsetMatch = p28.match(/GMT([+-]?\d+)/);
  if (offsetMatch) {
    offsetHours = parseInt(offsetMatch[1], 10);
  }

  // Build offset string like "-05:00" or "-06:00"
  const sign = offsetHours >= 0 ? "+" : "-";
  const absHours = Math.abs(offsetHours);
  const offsetStr = `${sign}${String(absHours).padStart(2, "0")}:00`;

  const startDate = new Date(`${datePart} ${startTime} GMT${offsetStr}`);
  const endDate = new Date(`${datePart} ${endTime} GMT${offsetStr}`);

  return {
    start: isNaN(startDate.getTime()) ? new Date().toISOString() : startDate.toISOString(),
    end: isNaN(endDate.getTime()) ? null : endDate.toISOString(),
  };
}

function parseRawEvent(raw: HogSyncRawEvent): HogSyncEvent | null {
  // Skip date separator rows
  if (raw.p0 === "true") return null;

  const { start, end } = parseDates(raw.p4 || "", raw.p28 || "");

  const imageUrl = raw.p11
    ? `https://hogsync.uark.edu${raw.p11.startsWith("/") ? "" : "/"}${raw.p11}`
    : null;

  return {
    id: raw.p1,
    name: raw.p3,
    startDate: start,
    endDate: end,
    location: raw.p6 || "",
    organizationName: raw.p9 || "",
    imageUrl,
    sourceUrl: `https://hogsync.uark.edu/rsvp_boot?id=${raw.p1}`,
    category: raw.p5 || "",
  };
}

export async function fetchHogSyncEvents(): Promise<HogSyncEvent[]> {
  const results: HogSyncEvent[] = [];
  const groupIds = await getGroupIds();

  for (const groupId of groupIds) {
    try {
      const url = `https://hogsync.uark.edu/mobile_ws/v17/mobile_events_list?range=0&limit=100&filter2=${groupId.trim()}`;
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!res.ok) {
        console.error(`Failed to fetch HogSync group ${groupId}: ${res.status}`);
        continue;
      }

      const data: HogSyncRawEvent[] = await res.json();

      for (const raw of data) {
        const event = parseRawEvent(raw);
        if (event) {
          results.push(event);
        }
      }
    } catch (err) {
      console.error(`Failed to fetch HogSync group ${groupId}:`, err);
    }
  }

  return results;
}

export function hogsyncToEvent(item: HogSyncEvent) {
  return {
    title: item.name,
    description: null,
    start_date: item.startDate,
    end_date: item.endDate,
    location_name: item.location || null,
    location_address: null,
    is_online: false,
    online_url: null,
    categories: [] as string[],
    primary_category: "business" as const,
    image_url: item.imageUrl,
    source_url: item.sourceUrl,
    source_platform: "hogsync",
    source_id: item.id,
    organizer_name: item.organizationName || "University of Arkansas",
    organizer_title: null,
    organizer_company: null,
    organizer_avatar_url: null,
    city: extractCity(item.location, null) || "Fayetteville",
    signals: extractSignals(item.name),
    status: "approved",
  };
}
