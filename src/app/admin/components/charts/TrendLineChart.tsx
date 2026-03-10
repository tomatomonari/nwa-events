"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from "recharts";

interface TrendLineChartProps {
  data: Record<string, any>[];
  xKey: string;
  lines: { key: string; color: string; name?: string }[];
  height?: number;
  area?: boolean;
}

export default function TrendLineChart({ data, xKey, lines, height = 250, area = false }: TrendLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        No data yet
      </div>
    );
  }

  const Chart = area ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e4df" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => {
            if (typeof v === "string" && v.includes("-")) {
              const d = new Date(v + "T00:00:00");
              return `${d.getMonth() + 1}/${d.getDate()}`;
            }
            return v;
          }}
        />
        <YAxis tick={{ fontSize: 11 }} width={40} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e8e4df" }}
          labelFormatter={(v) => {
            if (typeof v === "string" && v.includes("-")) {
              return new Date(v + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
            }
            return v;
          }}
        />
        {lines.map((line) =>
          area ? (
            <Area
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              fill={line.color}
              fillOpacity={0.15}
              name={line.name || line.key}
              strokeWidth={2}
            />
          ) : (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              name={line.name || line.key}
              strokeWidth={2}
              dot={false}
            />
          )
        )}
      </Chart>
    </ResponsiveContainer>
  );
}
