import { getServiceClient } from "./supabase";

export async function upsertEvents(
  events: Record<string, any>[]
): Promise<{
  synced: number;
  skipped: number;
  errors: { event_title: string; source_id: string; error: any }[];
}> {
  const supabase = getServiceClient();
  let synced = 0;
  let skipped = 0;
  const errors: { event_title: string; source_id: string; error: any }[] = [];

  for (const event of events) {
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("source_platform", event.source_platform)
      .eq("source_id", event.source_id)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from("events")
        .update(event)
        .eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("events").insert(event));
    }

    if (error) {
      errors.push({
        event_title: event.title,
        source_id: event.source_id,
        error,
      });
      skipped++;
    } else {
      synced++;
    }
  }

  return { synced, skipped, errors };
}
