import { getSupabase } from "@/lib/supabase";
import type { Event } from "@/lib/types";
import EventList from "@/components/EventList";

export const dynamic = "force-dynamic";

async function getEvents(): Promise<Event[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];

  try {
    const { data, error } = await getSupabase()
      .from("events")
      .select("*")
      .eq("status", "approved")
      .gte("start_date", new Date().toISOString())
      .order("start_date", { ascending: true });

    if (error) {
      console.error("Failed to fetch events:", error);
      return [];
    }

    return data as Event[];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const events = await getEvents();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          What&apos;s happening in NWA
        </h1>
        <p className="mt-2 text-muted-foreground text-lg">
          Networking, tech, startups, career &mdash; all in one place.
        </p>
      </div>
      <EventList events={events} />
    </div>
  );
}
