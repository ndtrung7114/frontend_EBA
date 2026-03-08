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
