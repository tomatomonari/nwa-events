"use client";

import { useState, useEffect } from "react";
import TrendLineChart from "../charts/TrendLineChart";
import KpiCard from "../charts/KpiCard";

interface EngagementData {
  topEvents: {
    eventId: string;
    title: string;
    startDate: string | null;
    views: number;
    registers: number;
    ctr: number;
  }[];
  dailyTrend: { date: string; views: number; registers: number }[];
  totalViews: number;
  totalRegisters: number;
}

interface EngagementTabProps {
  password: string;
}

export default function EngagementTab({ password }: EngagementTabProps) {
  const [data, setData] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats/engagement", {
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
    return <p className="text-muted-foreground">Failed to load engagement data.</p>;
  }

  const overallCtr = data.totalViews > 0 ? Math.round((data.totalRegisters / data.totalViews) * 100) : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">Engagement</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Total Views (30d)" value={data.totalViews} />
        <KpiCard label="Register Clicks (30d)" value={data.totalRegisters} />
        <KpiCard label="Overall CTR" value={`${overallCtr}%`} />
      </div>

      {/* Daily Trend */}
      {data.dailyTrend.length > 0 && (
        <div className="p-4 rounded-xl border border-border bg-background">
          <h3 className="text-sm font-bold mb-3">Daily Clicks</h3>
          <TrendLineChart
            data={data.dailyTrend}
            xKey="date"
            lines={[
              { key: "views", color: "#e8572a", name: "Views" },
              { key: "registers", color: "#6b6560", name: "Registers" },
            ]}
            area
          />
        </div>
      )}

      {/* Top Events */}
      <div className="p-4 rounded-xl border border-border bg-background">
        <h3 className="text-sm font-bold mb-3">Top Events by Views</h3>
        {data.topEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No click data yet. Views and register clicks will appear here once users interact with events.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-muted-foreground">Event</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Views</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Registers</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">CTR</th>
                </tr>
              </thead>
              <tbody>
                {data.topEvents.map((ev) => (
                  <tr key={ev.eventId} className="border-b border-border/50">
                    <td className="py-2 max-w-xs truncate">{ev.title}</td>
                    <td className="py-2 text-right">{ev.views}</td>
                    <td className="py-2 text-right">{ev.registers}</td>
                    <td className="py-2 text-right">{ev.ctr}%</td>
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
