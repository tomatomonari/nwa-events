import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { sendDigestEmail } from "@/lib/email";
import { buildDigestHtml } from "@/emails/digest";
import type { Event, Subscriber } from "@/lib/types";

export async function GET(req: NextRequest) {
  return handleDigest(req);
}

export async function POST(req: NextRequest) {
  return handleDigest(req);
}

async function handleDigest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();

  // Determine what day it is in Central Time
  const now = new Date();
  const ctDay = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "America/Chicago",
  }).format(now).toLowerCase();

  // Get all verified subscribers
  const { data: subscribers, error: subError } = await supabase
    .from("subscribers")
    .select("*")
    .eq("verified", true)
    .or("status.is.null,status.eq.active");

  if (subError || !subscribers) {
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }

  // ?force=true bypasses the day check so you can test weekly cadences
  const force = req.nextUrl.searchParams.get("force") === "true";

  // Filter: daily subscribers always, weekly only on their chosen day (or when forced)
  const eligible = (subscribers as Subscriber[]).filter(
    (s) =>
      s.cadence === "daily" ||
      (s.cadence === "weekly" && (force || (s.weekly_day || "sunday") === ctDay))
  );

  if (eligible.length === 0) {
    return NextResponse.json({ message: "No eligible subscribers today", sent: 0 });
  }

  // Build date ranges
  const todayCT = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Chicago" })
  );
  todayCT.setHours(0, 0, 0, 0);

  // Daily: today only. Weekly: 7 days.
  const dailyEnd = new Date(todayCT);
  dailyEnd.setDate(dailyEnd.getDate() + 1);

  const weeklyEnd = new Date(todayCT);
  weeklyEnd.setDate(weeklyEnd.getDate() + 7);

  // Fetch events for the wider range (weekly) — business only
  const { data: allEvents } = await supabase
    .from("events")
    .select("*")
    .eq("status", "approved")
    .eq("primary_category", "business")
    .gte("start_date", todayCT.toISOString())
    .lt("start_date", weeklyEnd.toISOString())
    .order("start_date", { ascending: true });

  const events = (allEvents || []) as Event[];

  let sent = 0;
  const errors: string[] = [];

  for (const subscriber of eligible) {
    try {
      // Filter by cadence window
      const endDate = subscriber.cadence === "daily" ? dailyEnd : weeklyEnd;
      const filtered = events.filter(
        (e) => new Date(e.start_date) < endDate
      );

      if (filtered.length === 0) continue;

      const subject =
        subscriber.cadence === "daily"
          ? `${filtered.length} event${filtered.length === 1 ? "" : "s"} happening today in NWA`
          : `Your weekly NWA events digest — ${filtered.length} events`;

      const htmlContent = buildDigestHtml(filtered, subscriber.cadence as "daily" | "weekly");

      await sendDigestEmail(
        subscriber.email,
        subject,
        htmlContent,
        subscriber.manage_token!
      );

      sent++;
    } catch (err) {
      errors.push(`${subscriber.email}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return NextResponse.json({
    message: `Sent ${sent} digest emails`,
    sent,
    eligible: eligible.length,
    skipped: eligible.length - sent - errors.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
