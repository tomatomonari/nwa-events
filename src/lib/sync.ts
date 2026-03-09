import { getServiceClient } from "./supabase";

/** Normalize title for fuzzy matching: lowercase, strip punctuation, collapse whitespace */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Get the date portion (YYYY-MM-DD) in Central Time */
function toDateCT(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-CA", {
    timeZone: "America/Chicago",
  });
}

/** Merge incoming event fields into existing record, preferring non-null values */
function mergeFields(
  existing: Record<string, any>,
  incoming: Record<string, any>
): Record<string, any> {
  const merged: Record<string, any> = {};

  // Fields where we prefer whichever is non-null/non-empty, favoring longer descriptions
  const fillableFields = [
    "description",
    "location_name",
    "location_address",
    "image_url",
    "organizer_title",
    "organizer_company",
    "organizer_avatar_url",
    "city",
    "online_url",
    "end_date",
    "hosts",
  ];

  for (const field of fillableFields) {
    const existingVal = existing[field];
    const incomingVal = incoming[field];

    // For array fields, treat empty arrays as empty
    const existingEmpty = Array.isArray(existingVal)
      ? existingVal.length === 0
      : !existingVal;
    const incomingHasValue = Array.isArray(incomingVal)
      ? incomingVal.length > 0
      : !!incomingVal;

    if (existingEmpty && incomingHasValue) {
      merged[field] = incomingVal;
    } else if (
      field === "description" &&
      existingVal &&
      incomingVal &&
      incomingVal.length > existingVal.length
    ) {
      merged[field] = incomingVal;
    }
  }

  // Merge signals: union of both
  if (incoming.signals?.length) {
    const existingSignals = existing.signals || [];
    const union = [...new Set([...existingSignals, ...incoming.signals])];
    if (union.length > existingSignals.length) {
      merged.signals = union;
    }
  }

  return merged;
}

export async function upsertEvents(
  events: Record<string, any>[]
): Promise<{
  synced: number;
  skipped: number;
  merged: number;
  errors: { event_title: string; source_id: string; error: any }[];
}> {
  const supabase = getServiceClient();
  let synced = 0;
  let skipped = 0;
  let merged = 0;
  const errors: { event_title: string; source_id: string; error: any }[] = [];

  for (const event of events) {
    // 1. Check for same-platform duplicate (existing logic)
    const { data: samePlatform } = await supabase
      .from("events")
      .select("id")
      .eq("source_platform", event.source_platform)
      .eq("source_id", event.source_id)
      .maybeSingle();

    if (samePlatform) {
      // Update existing same-platform record
      const { error } = await supabase
        .from("events")
        .update(event)
        .eq("id", samePlatform.id);

      if (error) {
        errors.push({ event_title: event.title, source_id: event.source_id, error });
        skipped++;
      } else {
        synced++;
      }
      continue;
    }

    // 2. Check for cross-platform duplicate: same date + similar title
    const eventDateCT = toDateCT(event.start_date);
    const normalizedIncoming = normalizeTitle(event.title);

    // Fetch all approved events on the same date
    const dayStart = `${eventDateCT}T00:00:00-06:00`;
    const dayEnd = `${eventDateCT}T23:59:59-06:00`;

    const { data: sameDayEvents } = await supabase
      .from("events")
      .select("*")
      .gte("start_date", dayStart)
      .lte("start_date", dayEnd);

    let crossPlatformMatch: Record<string, any> | null = null;

    if (sameDayEvents) {
      for (const existing of sameDayEvents) {
        if (existing.source_platform === event.source_platform) continue;

        const normalizedExisting = normalizeTitle(existing.title);

        // Check if titles match (one contains the other, or they're equal)
        const titlesMatch =
          normalizedExisting === normalizedIncoming ||
          normalizedExisting.includes(normalizedIncoming) ||
          normalizedIncoming.includes(normalizedExisting);

        if (titlesMatch) {
          crossPlatformMatch = existing;
          break;
        }
      }
    }

    if (crossPlatformMatch) {
      // Merge fields into existing record
      const updates = mergeFields(crossPlatformMatch, event);

      if (Object.keys(updates).length > 0) {
        await supabase
          .from("events")
          .update(updates)
          .eq("id", crossPlatformMatch.id);
      }

      merged++;
      synced++;
      continue;
    }

    // 3. New event — insert
    const { error } = await supabase.from("events").insert(event);

    if (error) {
      errors.push({ event_title: event.title, source_id: event.source_id, error });
      skipped++;
    } else {
      synced++;
    }
  }

  return { synced, skipped, merged, errors };
}
