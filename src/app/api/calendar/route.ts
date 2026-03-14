import { getSupabase } from "@/lib/supabase";
import type { Event } from "@/lib/types";

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function toIcsDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function buildVEvent(event: Event): string {
  const lines: string[] = [
    "BEGIN:VEVENT",
    `UID:${event.id}@nwa.events`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(event.start_date)}`,
  ];

  if (event.end_date) {
    lines.push(`DTEND:${toIcsDate(event.end_date)}`);
  }

  lines.push(`SUMMARY:${escapeIcsText(event.title)}`);

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  }

  if (event.location_name) {
    const location = event.location_address
      ? `${event.location_name}, ${event.location_address}`
      : event.location_name;
    lines.push(`LOCATION:${escapeIcsText(location)}`);
  }

  if (event.source_url) {
    lines.push(`URL:${event.source_url}`);
  }

  if (event.organizer_name) {
    lines.push(`ORGANIZER;CN=${escapeIcsText(event.organizer_name)}:MAILTO:noreply@nwa.events`);
  }

  lines.push("END:VEVENT");
  return lines.join("\r\n");
}

export async function GET() {
  const { data: events } = await getSupabase()
    .from("events")
    .select("*")
    .eq("status", "approved")
    .eq("primary_category", "business")
    .gte("start_date", new Date().toISOString())
    .lte("start_date", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
    .order("start_date", { ascending: true });

  const vevents = (events as Event[] || []).map(buildVEvent).join("\r\n");

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NWA Events//nwa.events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:NWA Events",
    "X-WR-TIMEZONE:America/Chicago",
    vevents,
    "END:VCALENDAR",
  ].join("\r\n");

  return new Response(calendar, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="nwa-events.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
