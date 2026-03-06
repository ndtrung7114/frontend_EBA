"use client";

import dynamic from "next/dynamic";
import type { MeterDataResponse } from "@/lib/types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Props {
  meterData: MeterDataResponse;
  rpStart: string;
  rpEnd: string;
  blStart: string;
  blEnd: string;
  trStart: string;
  trEnd: string;
  baselineEnabled: boolean;
}

export default function DataOverview({
  meterData,
  rpStart,
  rpEnd,
  blStart,
  blEnd,
  trStart,
  trEnd,
  baselineEnabled,
}: Props) {
  const dates = meterData.data.map((d) => d.date);
  const values = meterData.data.map((d) => d.daily_kwh);

  // Training region data
  const trData = meterData.data.filter(
    (d) => d.date >= trStart && d.date <= trEnd
  );

  // Reporting region data
  const rpData = meterData.data.filter(
    (d) => d.date >= rpStart && d.date <= rpEnd
  );

  // Monthly stats
  const monthly = computeMonthlyStats(meterData.data);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">{meterData.meter}</h2>
        <p className="text-sm text-gray-500">
          Site: {meterData.site} &middot; Type: {meterData.building_type} &middot;{" "}
          Total: {meterData.total_days} days &middot; Features:{" "}
          {meterData.features.length}
        </p>
      </div>

      {/* Timeline Chart */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-gray-700">
            📈 Energy Timeline with Period Annotations
          </h3>
        </div>
        <div className="p-2">
          <Plot
            data={[
              {
                x: dates,
                y: values,
                type: "scatter",
                mode: "markers",
                marker: { size: 3, color: "#90A4AE", opacity: 0.5 },
                name: "All Data",
                hovertemplate: "%{x}<br>%{y:.0f} kWh<extra></extra>",
              },
              {
                x: trData.map((d) => d.date),
                y: trData.map((d) => d.daily_kwh),
                type: "scatter",
                mode: "markers",
                marker: { size: 4, color: "#1565C0", opacity: 0.7 },
                name: `Training (${trData.length} days)`,
              },
              {
                x: rpData.map((d) => d.date),
                y: rpData.map((d) => d.daily_kwh),
                type: "scatter",
                mode: "markers",
                marker: { size: 4, color: "#2E7D32", opacity: 0.7 },
                name: `Reporting (${rpData.length} days)`,
              },
            ]}
            layout={{
              height: 380,
              margin: { l: 60, r: 20, t: 30, b: 40 },
              yaxis: { title: { text: "kWh/day" } },
              legend: {
                orientation: "h",
                y: 1.12,
                x: 0.5,
                xanchor: "center",
              },
              shapes: [
                {
                  type: "rect",
                  xref: "x",
                  yref: "paper",
                  x0: trStart,
                  x1: trEnd,
                  y0: 0,
                  y1: 1,
                  fillcolor: "rgba(21,101,192,0.06)",
                  line: { width: 0 },
                },
                {
                  type: "rect",
                  xref: "x",
                  yref: "paper",
                  x0: rpStart,
                  x1: rpEnd,
                  y0: 0,
                  y1: 1,
                  fillcolor: "rgba(46,125,50,0.06)",
                  line: { width: 0 },
                },
                ...(baselineEnabled && blStart && blEnd
                  ? [
                      {
                        type: "rect" as const,
                        xref: "x" as const,
                        yref: "paper" as const,
                        x0: blStart,
                        x1: blEnd,
                        y0: 0,
                        y1: 1,
                        fillcolor: "rgba(255,152,0,0.06)",
                        line: { width: 0 },
                      },
                    ]
                  : []),
              ],
              annotations: [
                {
                  x: trStart,
                  y: 1,
                  xref: "x",
                  yref: "paper",
                  text: "Training",
                  showarrow: false,
                  font: { size: 10, color: "#1565C0" },
                  xanchor: "left",
                },
                {
                  x: rpEnd,
                  y: 1,
                  xref: "x",
                  yref: "paper",
                  text: "Reporting",
                  showarrow: false,
                  font: { size: 10, color: "#2E7D32" },
                  xanchor: "right",
                },
              ],
              font: { family: "Inter, system-ui, sans-serif" },
            }}
            config={{ responsive: true, displayModeBar: false }}
            className="w-full"
          />
        </div>
      </div>

      {/* Period Summary Cards */}
      <div className={`grid grid-cols-1 ${baselineEnabled ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
        <PeriodCard
          title="🧠 Training Period"
          color="blue"
          start={trStart}
          end={trEnd}
          days={trData.length}
          avg={
            trData.length > 0
              ? trData.reduce((s, d) => s + d.daily_kwh, 0) / trData.length
              : 0
          }
        />
        {baselineEnabled && (
          <PeriodCard
            title="📅 Baseline Period"
            color="orange"
            start={blStart}
            end={blEnd}
            days={
              meterData.data.filter(
                (d) => blStart && blEnd && d.date >= blStart && d.date <= blEnd
              ).length
            }
          />
        )}
        <PeriodCard
          title="🎯 Reporting Period"
          color="green"
          start={rpStart}
          end={rpEnd}
          days={rpData.length}
          avg={
            rpData.length > 0
              ? rpData.reduce((s, d) => s + d.daily_kwh, 0) / rpData.length
              : 0
          }
        />
      </div>

      {/* Monthly Statistics Table */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-gray-700">
            📋 Monthly Statistics
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">
                  Month
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">
                  Count
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">
                  Mean
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">
                  Median
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">
                  Std
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">
                  Min
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">
                  Max
                </th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((row, i) => (
                <tr
                  key={row.month}
                  className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                >
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {row.month}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-600">
                    {row.count}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700 font-mono">
                    {row.mean.toFixed(1)}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-700 font-mono">
                    {row.median.toFixed(1)}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-600 font-mono">
                    {row.std.toFixed(1)}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-600 font-mono">
                    {row.min.toFixed(1)}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-600 font-mono">
                    {row.max.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function PeriodCard({
  title,
  color,
  start,
  end,
  days,
  avg,
  disabled,
}: {
  title: string;
  color: "blue" | "orange" | "green";
  start?: string;
  end?: string;
  days: number;
  avg?: number;
  disabled?: boolean;
}) {
  const borderColor = {
    blue: "border-l-blue-500",
    orange: "border-l-orange-500",
    green: "border-l-green-500",
  }[color];

  return (
    <div className={`card border-l-4 ${borderColor} p-4`}>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
      {disabled ? (
        <p className="text-xs text-gray-400">Disabled</p>
      ) : (
        <>
          <p className="text-xs text-gray-600">
            {start} → {end}
          </p>
          <p className="text-sm font-semibold text-gray-800 mt-1">
            {days} days
          </p>
          {avg !== undefined && avg > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Avg: {avg.toFixed(0)} kWh/day
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ── Helpers ──

interface MonthlyRow {
  month: string;
  count: number;
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
}

function computeMonthlyStats(data: { date: string; daily_kwh: number }[]): MonthlyRow[] {
  const groups: Record<string, number[]> = {};
  for (const d of data) {
    const key = d.date.slice(0, 7); // YYYY-MM
    if (!groups[key]) groups[key] = [];
    groups[key].push(d.daily_kwh);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, vals]) => {
      const sorted = [...vals].sort((a, b) => a - b);
      const sum = vals.reduce((s, v) => s + v, 0);
      const mean = sum / vals.length;
      const median =
        vals.length % 2 === 0
          ? (sorted[vals.length / 2 - 1] + sorted[vals.length / 2]) / 2
          : sorted[Math.floor(vals.length / 2)];
      const variance =
        vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
      return {
        month,
        count: vals.length,
        mean,
        median,
        std: Math.sqrt(variance),
        min: sorted[0],
        max: sorted[sorted.length - 1],
      };
    });
}
