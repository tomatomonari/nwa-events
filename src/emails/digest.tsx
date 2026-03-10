import type { Event } from "@/lib/types";

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  });
}

/** Build a clean location string, avoiding duplication between name and address */
function buildLocation(event: Event): string {
  const name = event.location_name?.trim() || "";
  const address = event.location_address?.trim() || "";

  if (!name && !address) return event.is_online ? "Online" : "";

  // If address contains the name (or vice versa), just use the longer one
  if (name && address) {
    const nameLower = name.toLowerCase();
    const addressLower = address.toLowerCase();
    if (addressLower.includes(nameLower)) return address;
    if (nameLower.includes(addressLower)) return name;
    return `${name}, ${address}`;
  }

  return name || address;
}

/** Group events by date string (e.g. "Monday, Mar 10") */
function groupByDate(events: Event[]): Map<string, Event[]> {
  const groups = new Map<string, Event[]>();
  for (const event of events) {
    const key = formatDate(event.start_date);
    const list = groups.get(key) || [];
    list.push(event);
    groups.set(key, list);
  }
  return groups;
}

export function buildDigestHtml(events: Event[], cadence: "daily" | "weekly" = "weekly"): string {
  const grouped = groupByDate(events);
  const greeting = cadence === "daily"
    ? "Howdy! Here's what's happening today in NWA. \u{1F920}"
    : "Howdy! Here's your week ahead in NWA. \u{1F920}";
  const sections: string[] = [
    `<p style="font-size:15px;color:#6b6560;margin:0 0 24px 0;">${greeting}</p>`,
  ];

  for (const [date, dayEvents] of grouped) {
    const eventCards: string[] = [];

    for (const event of dayEvents) {
      const time = formatTime(event.start_date);
      const location = buildLocation(event);
      const link = event.source_url || "#";
      const hosts = event.hosts && event.hosts.length > 0 ? event.hosts.join(", ") : null;

      const details: string[] = [];
      details.push(`&#128339; ${time}`);
      if (location) details.push(`&#128205; ${escapeHtml(location)}`);
      if (event.organizer_name) details.push(`Hosted by: ${escapeHtml(event.organizer_name)}`);
      if (hosts) details.push(`Organizers: ${escapeHtml(hosts)}`);

      eventCards.push(
        `<div style="margin-bottom:16px;padding-left:12px;">` +
        `<a href="${link}" style="font-size:15px;font-weight:600;color:#1a1a1a;text-decoration:none;">${escapeHtml(event.title)}</a>` +
        `<div style="font-size:13px;color:#6b6560;margin-top:4px;line-height:1.5;">${details.join("<br/>")}</div>` +
        `</div>`
      );
    }

    sections.push(
      `<div style="margin-bottom:24px;">` +
      `<h3 style="font-size:14px;font-weight:600;color:#e8572a;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px 0;padding-bottom:6px;border-bottom:1px solid #e8e4df;">${date}</h3>` +
      eventCards.join("") +
      `</div>`
    );
  }

  if (events.length === 0) {
    return `<p style="color:#6b6560;font-size:15px;">No upcoming events for this period.</p>`;
  }

  return sections.join("");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
