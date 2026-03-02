import { getServiceClient } from "./supabase";

/**
 * Mark events as recurring when 2+ events share the same (title, organizer_name).
 * Call this after each sync upsert loop.
 */
export async function markDuplicatesRecurring() {
  const supabase = getServiceClient();

  const { data: allEvents } = await supabase
    .from("events")
    .select("title, organizer_name");

  if (!allEvents) return;

  // Count occurrences of each (title, organizer_name) pair
  const counts = new Map<string, { title: string; organizer_name: string }>();
  const seen = new Map<string, number>();

  for (const row of allEvents) {
    const key = `${row.title}\0${row.organizer_name}`;
    seen.set(key, (seen.get(key) || 0) + 1);
    counts.set(key, { title: row.title, organizer_name: row.organizer_name });
  }

  // Update events with duplicate (title, organizer_name) to recurring = true
  for (const [key, count] of seen) {
    if (count >= 2) {
      const { title, organizer_name } = counts.get(key)!;
      await supabase
        .from("events")
        .update({ recurring: true })
        .eq("title", title)
        .eq("organizer_name", organizer_name)
        .eq("recurring", false);
    }
  }
}
