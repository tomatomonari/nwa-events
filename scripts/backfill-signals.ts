import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";
import { extractSignals } from "../src/lib/signals";

config({ path: resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function backfill() {
  const { data: events, error } = await supabase
    .from("events")
    .select("id, description");

  if (error) {
    console.error("Failed to fetch events:", error);
    return;
  }

  console.log(`Processing ${events.length} events...`);

  let updated = 0;
  for (const event of events) {
    const signals = extractSignals(event.description);
    if (signals.length === 0) continue;

    const { error: updateError } = await supabase
      .from("events")
      .update({ signals })
      .eq("id", event.id);

    if (updateError) {
      console.error(`Failed to update event ${event.id}:`, updateError);
    } else {
      updated++;
      console.log(`  ${event.id}: ${signals.join(", ")}`);
    }
  }

  console.log(`Done! Updated ${updated}/${events.length} events with signals.`);
}

backfill().catch(console.error);
