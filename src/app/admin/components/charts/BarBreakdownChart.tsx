"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface BarBreakdownChartProps {
  data: Record<string, any>[];
  xKey: string;
  bars: { key: string; color: string; name?: string }[];
  height?: number;
  layout?: "horizontal" | "vertical";
}

export default function BarBreakdownChart({ data, xKey, bars, height = 250, layout = "vertical" }: BarBreakdownChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        No data yet
      </div>
    );
  }

  if (layout === "horizontal") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e8e4df" />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey={xKey} tick={{ fontSize: 11 }} width={80} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e8e4df" }} />
          {bars.map((bar) => (
            <Bar key={bar.key} dataKey={bar.key} fill={bar.color} name={bar.name || bar.key} radius={[0, 4, 4, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e4df" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={40} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e8e4df" }} />
        {bars.map((bar) => (
          <Bar key={bar.key} dataKey={bar.key} fill={bar.color} name={bar.name || bar.key} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
