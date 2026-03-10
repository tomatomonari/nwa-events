"use client";

import { useState, useEffect } from "react";
import TrendLineChart from "../charts/TrendLineChart";
import BarBreakdownChart from "../charts/BarBreakdownChart";
import KpiCard from "../charts/KpiCard";

interface SubscriberData {
  subscribers: {
    email: string;
    cadence: string;
    weekly_day: string | null;
    status: string | null;
    verified: boolean;
    created_at: string;
  }[];
  growthTrend: { date: string; total: number }[];
  cadenceBreakdown: { daily: number; weekly: number };
  dayDistribution: Record<string, number>;
  totalActive: number;
  totalUnsubscribed: number;
}

interface SubscribersTabProps {
  password: string;
}

export default function SubscribersTab({ password }: SubscribersTabProps) {
  const [data, setData] = useState<SubscriberData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats/subscribers", {
      headers: { "x-admin-password": password },
    })
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [password]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">Failed to load subscriber data.</p>;
  }

  const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const dayChartData = DAYS.map((day) => ({
    day: day.slice(0, 3),
    count: data.dayDistribution[day] || 0,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Subscribers</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active Subscribers" value={data.totalActive} />
        <KpiCard label="Daily" value={data.cadenceBreakdown.daily} />
        <KpiCard label="Weekly" value={data.cadenceBreakdown.weekly} />
        <KpiCard label="Unsubscribed" value={data.totalUnsubscribed} />
      </div>

      {/* Growth Trend */}
      <div className="p-4 rounded-xl border border-border bg-background">
        <h3 className="text-sm font-bold mb-3">Subscriber Growth</h3>
        <TrendLineChart
          data={data.growthTrend}
          xKey="date"
          lines={[{ key: "total", color: "#e8572a", name: "Total Subscribers" }]}
          area
        />
      </div>

      {/* Weekly Day Distribution */}
      {data.cadenceBreakdown.weekly > 0 && (
        <div className="p-4 rounded-xl border border-border bg-background">
          <h3 className="text-sm font-bold mb-3">Weekly Delivery Day</h3>
          <BarBreakdownChart
            data={dayChartData}
            xKey="day"
            bars={[{ key: "count", color: "#6b6560", name: "Subscribers" }]}
            height={180}
          />
        </div>
      )}

      {/* Subscriber Table */}
      <div className="p-4 rounded-xl border border-border bg-background">
        <h3 className="text-sm font-bold mb-3">All Subscribers</h3>
        {data.subscribers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No subscribers yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground">Email</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Cadence</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Day</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody>
                {data.subscribers.map((sub) => (
                  <tr key={sub.email} className="border-b border-border/50">
                    <td className="py-2">{sub.email}</td>
                    <td className="py-2 capitalize">{sub.cadence}</td>
                    <td className="py-2 capitalize">{sub.cadence === "weekly" ? (sub.weekly_day || "sunday") : "-"}</td>
                    <td className="py-2">
                      {!sub.verified ? (
                        <span className="text-yellow-600">Unverified</span>
                      ) : sub.status === "unsubscribed" ? (
                        <span className="text-red-600">Unsubscribed</span>
                      ) : (
                        <span className="text-green-700">Active</span>
                      )}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {new Date(sub.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
