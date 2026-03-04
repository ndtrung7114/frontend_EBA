"use client";

import dynamic from "next/dynamic";
import MetricCard from "./MetricCard";
import type { AnalysisResponse } from "@/lib/types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Props {
  result: AnalysisResponse;
}

export default function Results({ result }: Props) {
  const { training, reporting, baseline, savings, model_info } = result;
  const r2 = (training.metrics.R2 as number) || 0;

  // Timeline data
  const trainDates = training.data.map((d) => d.date);
  const trainActual = training.data.map((d) => d.actual);

  const reportDates = reporting.data.map((d) => d.date);
  const reportActual = reporting.data.map((d) => d.actual);
  const reportPred = reporting.data.map((d) => d.predicted);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          label="R² (Train)"
          value={r2.toFixed(4)}
          variant={r2 > 0.7 ? "success" : r2 > 0.4 ? "info" : "danger"}
        />
        <MetricCard
          label="Training Days"
          value={training.days}
          subtitle={
            training.outlier_stats.outliers_removed > 0
              ? `-${training.outlier_stats.outliers_removed} outliers`
              : "No IQR"
          }
        />
      </div>

      {/* Model Info */}
      {model_info.best_alpha && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-4 py-2">
          <strong>ElasticNet</strong> — Best α: {Number(model_info.best_alpha).toFixed(6)}
          {model_info.best_l1_ratio !== undefined && (
            <> &middot; L1 ratio: {Number(model_info.best_l1_ratio).toFixed(4)}</>
          )}
          {model_info.n_nonzero_coefs !== undefined && (
            <> &middot; {Number(model_info.n_nonzero_coefs)}/{Number(model_info.n_total_coefs)} non-zero features</>
          )}
        </div>
      )}

      {/* R² Explanation */}
      <div className="card p-4 bg-gray-50 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">What R² means</h3>
        <p className="text-sm text-gray-600">
          R² (coefficient of determination) shows how much of the variation in energy use
          is explained by the model. It ranges from 0 to 1: closer to 1 means better fit.
          For example, R² = 0.80 means the model explains about 80% of the variation.
        </p>
      </div>

      {/* Timeline Chart */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-gray-700">
            📈 Timeline: Actual vs Predicted
          </h3>
        </div>
        <div className="p-2">
          <Plot
            data={[
              {
                x: trainDates,
                y: trainActual,
                type: "scatter",
                mode: "markers",
                marker: { size: 3, color: "#1565C0", opacity: 0.5 },
                name: `Training Actual (${training.days})`,
              },
              {
                x: reportDates,
                y: reportActual,
                type: "scatter",
                mode: "lines+markers",
                line: { color: "#2E7D32", width: 1 },
                marker: { size: 3 },
                name: "Reporting Actual",
              },
              {
                x: reportDates,
                y: reportPred,
                type: "scatter",
                mode: "lines",
                line: { color: "#E65100", width: 2, dash: "dash" },
                name: "Model Predicted",
              },
              ...(baseline
                ? [
                    {
                      x: baseline.data.map((d) => d.date),
                      y: baseline.data.map((d) => d.actual),
                      type: "scatter" as const,
                      mode: "markers" as const,
                      marker: { size: 3, color: "#FF9800", opacity: 0.5 },
                      name: `Baseline Actual (${baseline.days})`,
                    },
                  ]
                : []),
            ]}
            layout={{
              height: 420,
              margin: { l: 60, r: 20, t: 30, b: 40 },
              yaxis: { title: { text: "kWh/day" } },
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

      {/* Scatter + Residuals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-700">
              Actual vs Predicted
            </h3>
          </div>
          <div className="p-2">
            <Plot
              data={[
                {
                  x: reportActual,
                  y: reportPred,
                  type: "scatter",
                  mode: "markers",
                  marker: { size: 5, color: "#1565C0", opacity: 0.7 },
                  name: "Reporting",
                },
                {
                  x: [
                    Math.min(...reportActual),
                    Math.max(...reportActual),
                  ],
                  y: [
                    Math.min(...reportActual),
                    Math.max(...reportActual),
                  ],
                  type: "scatter",
                  mode: "lines",
                  line: { color: "#E0E0E0", width: 1, dash: "dash" },
                  name: "Perfect fit",
                },
              ]}
              layout={{
                height: 320,
                margin: { l: 50, r: 20, t: 20, b: 50 },
                xaxis: { title: { text: "Actual (kWh)" } },
                yaxis: { title: { text: "Predicted (kWh)" } },
                showlegend: false,
                font: { family: "Inter, system-ui, sans-serif" },
              }}
              config={{ responsive: true, displayModeBar: false }}
              className="w-full"
            />
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-700">
              Residuals Distribution
            </h3>
          </div>
          <div className="p-2">
            <Plot
              data={[
                {
                  x: reportActual.map(
                    (a, i) => a - reportPred[i]
                  ),
                  type: "histogram",
                  marker: { color: "#1565C0", opacity: 0.7 },
                  name: "Residual",
                },
              ]}
              layout={{
                height: 320,
                margin: { l: 50, r: 20, t: 20, b: 50 },
                xaxis: { title: { text: "Residual (kWh)" } },
                yaxis: { title: { text: "Count" } },
                showlegend: false,
                font: { family: "Inter, system-ui, sans-serif" },
              }}
              config={{ responsive: true, displayModeBar: false }}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Monthly Savings Bar */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-gray-700">
            📊 Monthly: Baseline Actual vs Reporting Actual
          </h3>
        </div>
        <div className="p-2">
          <Plot
            data={[
              {
                x: result.monthly_savings.map((r) => r.month),
                y: result.monthly_savings.map((r) => r.baseline),
                type: "bar",
                name: "Baseline Actual",
                marker: { color: "#FF9800" },
                text: result.monthly_savings.map((r) =>
                  r.baseline.toLocaleString("en", { maximumFractionDigits: 0 })
                ),
                textposition: "outside",
                textfont: { size: 9 },
              },
              {
                x: result.monthly_savings.map((r) => r.month),
                y: result.monthly_savings.map((r) => r.actual),
                type: "bar",
                name: "Actual (Reporting)",
                marker: { color: "#E65100" },
                text: result.monthly_savings.map((r) =>
                  r.actual.toLocaleString("en", { maximumFractionDigits: 0 })
                ),
                textposition: "outside",
                textfont: { size: 9 },
              },
            ]}
            layout={{
              barmode: "group",
              height: 420,
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

      {/* Savings Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Baseline Total"
          value={`${Number(savings.baseline_total_kwh).toLocaleString()} kWh`}
          variant="info"
        />
        <MetricCard
          label="Reporting Total"
          value={`${Number(savings.reporting_total_kwh).toLocaleString()} kWh`}
        />
        <MetricCard
          label="Net Savings"
          value={`${Number(savings.total_savings_kwh) >= 0 ? "+" : ""}${Number(
            savings.total_savings_kwh
          ).toLocaleString()} kWh`}
          variant={Number(savings.total_savings_kwh) > 0 ? "success" : "danger"}
        />
        <MetricCard
          label="Savings %"
          value={`${Number(savings.savings_pct) >= 0 ? "+" : ""}${Number(
            savings.savings_pct
          ).toFixed(1)}%`}
          variant={Number(savings.savings_pct) > 0 ? "success" : "danger"}
        />
      </div>

      {/* Cumulative Savings */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-gray-700">
            📈 Model Fit: Cumulative Residual
          </h3>
        </div>
        <div className="p-2">
          <Plot
            data={[
              {
                x: reportDates,
                y: reportActual,
                type: "scatter",
                mode: "lines",
                line: { color: "#1565C0", width: 1 },
                name: "Actual",
                yaxis: "y",
              },
              {
                x: reportDates,
                y: reportPred,
                type: "scatter",
                mode: "lines",
                line: { color: "#E65100", width: 1, dash: "dash" },
                name: "Model Predicted",
                fill: "tonexty",
                fillcolor: "rgba(76,175,80,0.12)",
                yaxis: "y",
              },
              {
                x: reportDates,
                y: reporting.cumulative_savings,
                type: "scatter",
                mode: "lines",
                line: { color: "#7B1FA2", width: 2, dash: "dot" },
                name: "Cumulative Savings",
                yaxis: "y2",
              },
            ]}
            layout={{
              height: 380,
              margin: { l: 60, r: 60, t: 30, b: 40 },
              yaxis: { title: { text: "kWh/day" } },
              yaxis2: {
                title: { text: "Cumul. Savings (kWh)" },
                overlaying: "y",
                side: "right",
              },
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

      {/* Download */}
      <div className="flex justify-end">
        <button
          onClick={() => downloadCSV(result)}
          className="btn-primary flex items-center gap-2"
        >
          📥 Download Results (CSV)
        </button>
      </div>
    </div>
  );
}

function downloadCSV(result: AnalysisResponse) {
  const rows = result.reporting.data.map((d, i) => ({
    date: d.date,
    actual_kwh: d.actual,
    predicted_kwh: d.predicted,
    residual: (d.actual - d.predicted).toFixed(2),
    savings: result.reporting.savings_daily[i],
    cumulative_savings: result.reporting.cumulative_savings[i],
  }));
  const header = Object.keys(rows[0]).join(",");
  const csv = [header, ...rows.map((r) => Object.values(r).join(","))].join(
    "\n"
  );
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "eba_normalized_results.csv";
  a.click();
  URL.revokeObjectURL(url);
}
