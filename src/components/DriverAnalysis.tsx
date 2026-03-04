"use client";

import dynamic from "next/dynamic";
import type { AnalysisResponse } from "@/lib/types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

const COLORS = [
  "#4FC3F7", "#81C784", "#FFB74D", "#E57373", "#BA68C8",
  "#4DD0E1", "#AED581", "#FFD54F", "#FF8A65", "#7986CB",
  "#F06292", "#A1887F", "#90A4AE", "#FFF176", "#CE93D8",
  "#80CBC4", "#FFCC80", "#EF9A9A", "#B39DDB", "#C5E1A5",
  "#BCAAA4",
];

interface Props {
  result: AnalysisResponse;
}

export default function DriverAnalysis({ result }: Props) {
  const { drivers } = result;
  const nonzeroFeats = drivers.drivers.map((d) => d.feature);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          🔍 Driver Analysis — Why Did Energy Change?
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Shows how much each feature contributed to the predicted normalized
          baseline. Answers: &ldquo;Why is the baseline different from
          actual?&rdquo;
        </p>
      </div>

      {/* Monthly Feature Contributions */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-gray-700">
            📊 Monthly Feature Contributions (kWh)
          </h3>
        </div>
        <div className="p-2">
          <Plot
            data={nonzeroFeats.map((feat, i) => ({
              x: drivers.monthly_contributions.map((m) => m.month),
              y: drivers.monthly_contributions.map(
                (m) => m.contributions[feat] || 0
              ),
              type: "bar" as const,
              name: feat,
              marker: { color: COLORS[i % COLORS.length] },
            }))}
            layout={{
              barmode: "relative",
              height: 480,
              margin: { l: 60, r: 20, t: 30, b: 100 },
              xaxis: { title: { text: "Month" } },
              yaxis: { title: { text: "Contribution (kWh)" } },
              legend: {
                orientation: "h",
                y: -0.25,
                x: 0.5,
                xanchor: "center",
                font: { size: 9 },
              },
              font: { family: "Inter, system-ui, sans-serif" },
            }}
            config={{ responsive: true, displayModeBar: false }}
            className="w-full"
          />
        </div>
      </div>

      {/* Training vs Reporting Feature Change */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-gray-700">
            🔄 Training vs Reporting — Feature Change Analysis
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Compare average feature values between training and reporting periods
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">
                  Feature
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">
                  Training Avg
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">
                  Reporting Avg
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">
                  Change
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">
                  Coefficient
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">
                  Energy Impact
                </th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 uppercase">
                  Direction
                </th>
              </tr>
            </thead>
            <tbody>
              {drivers.drivers.map((d, i) => (
                <tr
                  key={d.feature}
                  className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                >
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {d.feature}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-gray-700">
                    {d.training_avg.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-gray-700">
                    {d.reporting_avg.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    <span
                      className={
                        d.change >= 0 ? "text-green-700" : "text-red-700"
                      }
                    >
                      {d.change >= 0 ? "+" : ""}
                      {d.change.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-gray-600">
                    {d.coefficient.toFixed(4)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono font-semibold">
                    <span
                      className={
                        d.energy_impact >= 0
                          ? "text-red-700"
                          : "text-green-700"
                      }
                    >
                      {d.energy_impact >= 0 ? "+" : ""}
                      {d.energy_impact.toFixed(2)} kWh/day
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span
                      className={`badge ${
                        d.direction === "increase"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {d.direction === "increase" ? "↑" : "↓"} {d.direction}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Business Summary */}
      <div className="card overflow-hidden">
        <div className="card-header bg-blue-50">
          <h3 className="text-sm font-semibold text-blue-800">
            💡 Business Summary
          </h3>
        </div>
        <div className="card-body">
          <p className="text-sm text-gray-700 font-medium mb-3">
            <strong>{result.meter}</strong> — {result.site} /{" "}
            {result.building_type}
          </p>
          <p className="text-sm text-gray-600 mb-3">Model: ElasticNet</p>
          <h4 className="text-sm font-semibold text-gray-800 mb-2">
            Key drivers of baseline change:
          </h4>
          <ul className="space-y-1.5">
            {drivers.drivers.slice(0, 5).map((d) => (
              <li
                key={d.feature}
                className="text-sm text-gray-700 flex items-start gap-2"
              >
                <span className="mt-0.5">
                  {d.energy_impact >= 0 ? "🔺" : "🔻"}
                </span>
                <span>
                  <strong>{d.feature}</strong>: {d.direction} of{" "}
                  {Math.abs(d.change).toFixed(2)} →{" "}
                  {d.energy_impact >= 0 ? "+" : ""}
                  {d.energy_impact.toFixed(2)} kWh/day impact
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Download */}
      <div className="flex justify-end">
        <button
          onClick={() => downloadDrivers(result)}
          className="btn-primary flex items-center gap-2"
        >
          📥 Download Driver Analysis (CSV)
        </button>
      </div>
    </div>
  );
}

function downloadDrivers(result: AnalysisResponse) {
  const header =
    "feature,training_avg,reporting_avg,change,coefficient,energy_impact,direction";
  const rows = result.drivers.drivers.map(
    (d) =>
      `${d.feature},${d.training_avg},${d.reporting_avg},${d.change},${d.coefficient},${d.energy_impact},${d.direction}`
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "eba_driver_analysis.csv";
  a.click();
  URL.revokeObjectURL(url);
}
