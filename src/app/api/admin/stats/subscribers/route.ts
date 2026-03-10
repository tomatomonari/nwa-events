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

  const [subscribersResult, unsubscribedResult] = await Promise.all([
    supabase
      .from("subscribers")
      .select("email, cadence, weekly_day, status, verified, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("subscribers")
      .select("created_at")
      .eq("status", "unsubscribed"),
  ]);

  const subscribers = subscribersResult.data || [];
  const unsubscribed = unsubscribedResult.data || [];

  // Build growth trend (cumulative by date)
  const activeByDate: Record<string, number> = {};
  for (const s of subscribers) {
    if (!s.verified) continue;
    const date = s.created_at.split("T")[0];
    activeByDate[date] = (activeByDate[date] || 0) + 1;
  }

  // Sort dates and make cumulative
  const sortedDates = Object.keys(activeByDate).sort();
  let cumulative = 0;
  const growthTrend = sortedDates.map((date) => {
    cumulative += activeByDate[date];
    return { date, total: cumulative };
  });

  // Cadence breakdown
  const active = subscribers.filter((s) => s.verified && s.status !== "unsubscribed");
  const cadenceBreakdown = {
    daily: active.filter((s) => s.cadence === "daily").length,
    weekly: active.filter((s) => s.cadence === "weekly").length,
  };

  // Weekly day distribution
  const dayDistribution: Record<string, number> = {};
  for (const s of active.filter((s) => s.cadence === "weekly")) {
    const day = s.weekly_day || "sunday";
    dayDistribution[day] = (dayDistribution[day] || 0) + 1;
  }

  return NextResponse.json({
    subscribers,
    growthTrend,
    cadenceBreakdown,
    dayDistribution,
    totalActive: active.length,
    totalUnsubscribed: unsubscribed.length,
  });
}
