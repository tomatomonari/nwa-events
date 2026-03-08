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

export function buildDigestHtml(events: Event[]): string {
  const grouped = groupByDate(events);
  let html = "";

  for (const [date, dayEvents] of grouped) {
    html += `
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; font-weight: 600; color: #e8572a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e8e4df;">
          ${date}
        </h3>
    `;

    for (const event of dayEvents) {
      const time = formatTime(event.start_date);
      const location = event.location_name || (event.is_online ? "Online" : "");
      const link = event.source_url || "#";

      html += `
        <div style="margin-bottom: 16px; padding-left: 12px;">
          <a href="${link}" style="font-size: 15px; font-weight: 600; color: #1a1a1a; text-decoration: none;">
            ${escapeHtml(event.title)}
          </a>
          <div style="font-size: 13px; color: #6b6560; margin-top: 2px;">
            ${time}${location ? ` &middot; ${escapeHtml(location)}` : ""}${event.organizer_name ? ` &middot; ${escapeHtml(event.organizer_name)}` : ""}
          </div>
        </div>
      `;
    }

    html += `</div>`;
  }

  if (events.length === 0) {
    html = `<p style="color: #6b6560; font-size: 15px;">No upcoming events for this period.</p>`;
  }

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
