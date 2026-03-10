import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

function isAdmin(req: NextRequest) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();

  // Run all queries in parallel
  const [
    subscriberResult,
    eventCountResult,
    upcomingResult,
    syncLogsResult,
    emailStatsResult,
    pendingResult,
  ] = await Promise.all([
    // Subscriber totals
    supabase
      .from("subscribers")
      .select("cadence, weekly_day, status, verified", { count: "exact" })
      .eq("verified", true)
      .or("status.is.null,status.eq.active"),

    // Events by source
    supabase
      .from("events")
      .select("source_platform")
      .eq("status", "approved"),

    // Upcoming events count
    supabase
      .from("events")
      .select("id", { count: "exact" })
      .eq("status", "approved")
      .gte("start_date", new Date().toISOString()),

    // Latest sync per source
    supabase
      .from("sync_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),

    // Email stats (last 7 days)
    supabase
      .from("email_events")
      .select("event_type")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

    // Pending events
    supabase
      .from("events")
      .select("id", { count: "exact" })
      .eq("status", "pending"),
  ]);

  // Subscriber breakdown
  const subscribers = subscriberResult.data || [];
  const subscriberStats = {
    total: subscribers.length,
    daily: subscribers.filter((s) => s.cadence === "daily").length,
    weekly: subscribers.filter((s) => s.cadence === "weekly").length,
  };

  // Events by source
  const eventsBySource: Record<string, number> = {};
  for (const e of eventCountResult.data || []) {
    const platform = e.source_platform || "manual";
    eventsBySource[platform] = (eventsBySource[platform] || 0) + 1;
  }

  // Latest sync per source
  const latestSyncs: Record<string, any> = {};
  for (const log of syncLogsResult.data || []) {
    if (!latestSyncs[log.source]) {
      latestSyncs[log.source] = log;
    }
  }

  // Email rates
  const emailEvents = emailStatsResult.data || [];
  const delivered = emailEvents.filter((e) => e.event_type === "email.delivered").length;
  const opened = emailEvents.filter((e) => e.event_type === "email.opened").length;
  const clicked = emailEvents.filter((e) => e.event_type === "email.clicked").length;

  return NextResponse.json({
    subscribers: subscriberStats,
    upcomingEvents: upcomingResult.count || 0,
    pendingEvents: pendingResult.count || 0,
    eventsBySource,
    latestSyncs,
    email7d: {
      delivered,
      opened,
      clicked,
      openRate: delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
      clickRate: delivered > 0 ? Math.round((clicked / delivered) * 100) : 0,
    },
  });
}
