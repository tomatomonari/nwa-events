import { NextResponse } from "next/server";

const NWA_CALENDARS = (process.env.LUMA_NWA_CALENDARS || "onwardfx,StartupJunkie").split(",");

export async function GET() {
  const debug: any[] = [];

  for (const calendarSlug of NWA_CALENDARS) {
    try {
      const url = `https://luma.com/${calendarSlug.trim()}`;
      debug.push({ step: "fetching", url });

      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      debug.push({ step: "fetch_status", status: res.status, ok: res.ok });

      if (!res.ok) {
        debug.push({ step: "fetch_failed", status: res.status });
        continue;
      }

      const html = await res.text();
      debug.push({ step: "html_length", length: html.length });

      const jsonMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
      debug.push({ step: "json_match", found: !!jsonMatch });

      if (!jsonMatch) {
        debug.push({ step: "json_not_found", html_preview: html.slice(0, 500) });
        continue;
      }

      const pageData = JSON.parse(jsonMatch[1]);
      const calendarData = pageData?.props?.pageProps?.initialData?.data?.calendar;

      debug.push({
        step: "parsed_data",
        has_calendar: !!calendarData,
        calendar_keys: calendarData ? Object.keys(calendarData).slice(0, 10) : null
      });

      const items = calendarData?.featured_items || calendarData?.entries || [];
      debug.push({ step: "items_found", count: items.length });

    } catch (err: any) {
      debug.push({ step: "error", error: err.message, stack: err.stack });
    }
  }

  return NextResponse.json({ debug });
}
