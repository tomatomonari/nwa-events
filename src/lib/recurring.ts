import { getServiceClient } from "./supabase";

/**
 * Mark events as recurring when 2+ upcoming events share the same (title, organizer_name).
 * Also resets recurring=false for events that no longer have duplicates.
 * Call this after each sync upsert loop.
 */
export async function markDuplicatesRecurring() {
  const supabase = getServiceClient();
  const now = new Date().toISOString();

  const { data: upcomingEvents } = await supabase
    .from("events")
    .select("title, organizer_name")
    .gte("start_date", now);

  if (!upcomingEvents) return;

  // Count occurrences of each (title, organizer_name) pair among upcoming events
  const seen = new Map<string, { title: string; organizer_name: string; count: number }>();

  for (const row of upcomingEvents) {
    const key = `${row.title}\0${row.organizer_name}`;
    const entry = seen.get(key);
    if (entry) {
      entry.count++;
    } else {
      seen.set(key, { title: row.title, organizer_name: row.organizer_name, count: 1 });
    }
  }

  for (const { title, organizer_name, count } of seen.values()) {
    if (count >= 2) {
      // Mark as recurring
      await supabase
        .from("events")
        .update({ recurring: true })
        .eq("title", title)
        .eq("organizer_name", organizer_name)
        .eq("recurring", false);
    } else {
      // Only one upcoming instance — not recurring anymore
      await supabase
        .from("events")
        .update({ recurring: false })
        .eq("title", title)
        .eq("organizer_name", organizer_name)
        .eq("recurring", true);
    }
  }
}
