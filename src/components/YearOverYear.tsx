"use client";

import dynamic from "next/dynamic";
import MetricCard from "./MetricCard";
import type { AnalysisResponse } from "@/lib/types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Props {
  result: AnalysisResponse;
}

export default function YearOverYear({ result }: Props) {
  const { yoy } = result;
  const months = yoy.months;
  const totals = yoy.totals;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          📅 Year-over-Year Comparison
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Baseline Actual vs Reporting Actual — a direct comparison of energy
          consumption between the two periods, matched by calendar month.
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        💡 <strong>Savings</strong> = Baseline Actual − Reporting Actual.
        Positive savings mean consumption decreased in the reporting period
        compared to the baseline.
      </div>

      {/* YoY Bar Chart */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-gray-700">
            Year-over-Year: Baseline Actual vs Reporting Actual
          </h3>
        </div>
        <div className="p-2">
          <Plot
            data={[
              {
                x: months.map((m) => m.month),
                y: months.map((m) => m.baseline_actual ?? 0),
                type: "bar",
                name: "Baseline Actual",
                marker: { color: "#FF9800" },
                text: months.map((m) =>
                  m.baseline_actual
                    ? m.baseline_actual.toLocaleString("en", {
                        maximumFractionDigits: 0,
                      })
                    : ""
                ),
                textposition: "outside",
                textfont: { size: 8 },
              },
              {
                x: months.map((m) => m.month),
                y: months.map((m) => m.reporting_actual ?? 0),
                type: "bar",
                name: "Reporting Actual",
                marker: { color: "#2E7D32" },
                text: months.map((m) =>
                  m.reporting_actual
                    ? m.reporting_actual.toLocaleString("en", {
                        maximumFractionDigits: 0,
                      })
                    : ""
                ),
                textposition: "outside",
                textfont: { size: 8 },
              },
            ]}
            layout={{
              barmode: "group",
              height: 480,
              margin: { l: 60, r: 20, t: 30, b: 40 },
              xaxis: { title: { text: "Month" } },
              yaxis: { title: { text: "Total kWh" } },
              legend: {
                orientation: "h",
                y: 1.12,
                x: 0.5,
                xanchor: "center",
              },
              font: { family: "Inter, system-ui, sans-serif" },
            }}
            config={{ responsive: true, displayModeBar: false }}
            className="w-full"
          />
        </div>
      </div>

      {/* Summary Table */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-gray-700">
            📋 Year-over-Year Summary Table
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">
                  Month
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">
                  Baseline (kWh)
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">
                  Reporting (kWh)
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">
                  Savings (kWh)
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">
                  Savings %
                </th>
              </tr>
            </thead>
            <tbody>
              {months.map((m, i) => {
                const hasData = m.baseline_actual || m.reporting_actual;
                if (!hasData) return null;
                return (
                  <tr
                    key={m.month}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    <td className="px-3 py-2 font-medium text-gray-900">
                      {m.month}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-gray-700">
                      {m.baseline_actual?.toLocaleString() ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-gray-700">
                      {m.reporting_actual?.toLocaleString() ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      <span
                        className={
                          (m.savings_kwh ?? 0) >= 0
                            ? "text-green-700"
                            : "text-red-700"
                        }
                      >
                        {m.savings_kwh != null
                          ? `${m.savings_kwh >= 0 ? "+" : ""}${m.savings_kwh.toLocaleString()}`
                          : "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      <span
                        className={
                          (m.savings_pct ?? 0) >= 0
                            ? "text-green-700"
                            : "text-red-700"
                        }
                      >
                        {m.savings_pct != null
                          ? `${m.savings_pct >= 0 ? "+" : ""}${m.savings_pct.toFixed(1)}%`
                          : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Period Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Baseline Actual"
          value={`${Number(totals.baseline_actual).toLocaleString()} kWh`}
          variant="info"
        />
        <MetricCard
          label="Reporting Actual"
          value={`${Number(totals.reporting_actual).toLocaleString()} kWh`}
        />
        <MetricCard
          label="Savings"
          value={`${Number(totals.savings_kwh) >= 0 ? "+" : ""}${Number(
            totals.savings_kwh
          ).toLocaleString()} kWh`}
          subtitle={
            totals.savings_pct != null
              ? `${Number(totals.savings_pct) >= 0 ? "+" : ""}${Number(
                  totals.savings_pct
                ).toFixed(1)}%`
              : undefined
          }
          variant={Number(totals.savings_kwh) >= 0 ? "success" : "danger"}
        />
        <MetricCard
          label="Savings %"
          value={
            totals.savings_pct != null
              ? `${Number(totals.savings_pct) >= 0 ? "+" : ""}${Number(
                  totals.savings_pct
                ).toFixed(1)}%`
              : "—"
          }
          variant={Number(totals.savings_pct) >= 0 ? "success" : "danger"}
        />
      </div>

      {/* Explanation */}
      <div className="card p-5 bg-gray-50">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          How to read this chart
        </h4>
        <ul className="text-xs text-gray-600 space-y-1.5">
          <li>
            <strong>Baseline Actual</strong> = Historical consumption in the baseline period
          </li>
          <li>
            <strong>Reporting Actual</strong> = Current consumption in the reporting period
          </li>
          <li>
            <strong>Savings</strong> = Baseline Actual − Reporting Actual (positive = energy saved)
          </li>
          <li>
            Months are matched by calendar month number for direct comparison
          </li>
        </ul>
      </div>

      {/* Download */}
      <div className="flex justify-end">
        <button
          onClick={() => downloadYoY(result)}
          className="btn-primary flex items-center gap-2"
        >
          📥 Download YoY Comparison (CSV)
        </button>
      </div>
    </div>
  );
}

function downloadYoY(result: AnalysisResponse) {
  const header = "Month,Baseline Actual (kWh),Reporting Actual (kWh),Savings (kWh),Savings (%)";
  const rows = result.yoy.months
    .filter((m) => m.baseline_actual || m.reporting_actual)
    .map(
      (m) =>
        `${m.month},${m.baseline_actual ?? ""},${m.reporting_actual ?? ""},${m.savings_kwh ?? ""},${m.savings_pct ?? ""}`
    );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "eba_yoy_comparison.csv";
  a.click();
  URL.revokeObjectURL(url);
}
