"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import MetricCard from "./MetricCard";
import type { AnalysisResponse } from "@/lib/types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Props {
  result: AnalysisResponse;
}

export default function Results({ result }: Props) {
  const { training, reporting, baseline, savings, model_info } = result;
  const r2Train = (training.metrics.R2 as number) || 0;
  const r2Test = (reporting.metrics.R2 as number) || 0;
  const cvrmse = (reporting.metrics.CVRMSE_pct as number) || 0;
  const nmbe = (reporting.metrics.NMBE_pct as number) || 0;

  // Savings chart view mode
  const [savingsView, setSavingsView] = useState<"day" | "month" | "year">("month");

  const savingsChartData = (() => {
    if (savingsView === "day") {
      return reporting.data.map((d) => ({
        label: d.date,
        actual: d.actual,
        predicted: d.predicted,
      }));
    }
    if (savingsView === "year") {
      const groups: Record<string, { actual: number; predicted: number }> = {};
      for (const d of reporting.data) {
        const year = d.date.slice(0, 4);
        if (!groups[year]) groups[year] = { actual: 0, predicted: 0 };
        groups[year].actual += d.actual;
        groups[year].predicted += d.predicted;
      }
      return Object.entries(groups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([year, v]) => ({
          label: year,
          actual: Math.round(v.actual),
          predicted: Math.round(v.predicted),
        }));
    }
    // month (default)
    return result.monthly_savings.map((r) => ({
      label: r.month,
      actual: r.actual,
      predicted: r.predicted ?? 0,
    }));
  })();

  // Timeline data
  const trainDates = training.data.map((d) => d.date);
  const trainActual = training.data.map((d) => d.actual);

  const reportDates = reporting.data.map((d) => d.date);
  const reportActual = reporting.data.map((d) => d.actual);
  const reportPred = reporting.data.map((d) => d.predicted);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative group">
          <MetricCard
            label="R² (Train)"
            value={r2Train.toFixed(4)}
            variant={r2Train > 0.7 ? "success" : r2Train > 0.4 ? "info" : "danger"}
          />
          <div className="hidden group-hover:block absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
            <strong>R² (Coefficient of Determination)</strong> on training set.
            Measures how well the model fits the training data. Range: 0–1, higher is better.
            &gt;0.7 = good, &gt;0.85 = excellent.
          </div>
        </div>
        <div className="relative group">
          <MetricCard
            label="R² (Test)"
            value={r2Test.toFixed(4)}
            variant={r2Test > 0.7 ? "success" : r2Test > 0.4 ? "info" : "danger"}
          />
          <div className="hidden group-hover:block absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
            <strong>R² (Coefficient of Determination)</strong> on reporting/test set.
            Shows how well the model generalizes to unseen data. If much lower than train R²,
            the model may be overfitting.
          </div>
        </div>
        <div className="relative group">
          <MetricCard
            label="CVRMSE"
            value={`${cvrmse.toFixed(2)}%`}
            variant={cvrmse < 25 ? "success" : cvrmse < 50 ? "info" : "danger"}
          />
          <div className="hidden group-hover:block absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
            <strong>CV(RMSE)</strong> — Coefficient of Variation of RMSE.
            Normalizes RMSE by mean consumption. ASHRAE Guideline 14 recommends &lt;25% for
            daily data. Lower = more accurate predictions.
          </div>
        </div>
        <div className="relative group">
          <MetricCard
            label="NMBE"
            value={`${nmbe >= 0 ? "+" : ""}${nmbe.toFixed(2)}%`}
            variant={Math.abs(nmbe) < 10 ? "success" : Math.abs(nmbe) < 20 ? "info" : "danger"}
          />
          <div className="hidden group-hover:block absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
            <strong>NMBE</strong> — Normalized Mean Bias Error.
            Shows systematic over/under-prediction. Positive = model under-predicts.
            ASHRAE Guideline 14 recommends |NMBE| &lt;10% for daily data.
          </div>
        </div>
      </div>

      {/* Additional Training Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          label="Training Days"
          value={training.days}
          subtitle={
            training.outlier_stats.outliers_removed > 0
              ? `-${training.outlier_stats.outliers_removed} outliers`
              : "No IQR"
          }
        />
        <MetricCard
          label="Reporting Days"
          value={reporting.days}
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

      {/* Savings Bar Chart with view toggle */}
      <div className="card overflow-hidden">
        <div className="card-header flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            📊 Reporting Actual vs Reporting Predicted
          </h3>
          <div className="flex rounded-md border border-gray-200 overflow-hidden text-xs">
            {(["day", "month", "year"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setSavingsView(v)}
                className={`px-3 py-1 capitalize ${
                  savingsView === v
                    ? "bg-blue-600 text-white font-semibold"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="p-2">
          <Plot
            data={[
              {
                x: savingsChartData.map((r) => r.label),
                y: savingsChartData.map((r) => r.actual),
                type: "bar",
                name: "Reporting Actual",
                marker: { color: "#2E7D32" },
                text: savingsChartData.map((r) =>
                  r.actual.toLocaleString("en", { maximumFractionDigits: 0 })
                ),
                textposition: "outside",
                textfont: { size: 9 },
              },
              {
                x: savingsChartData.map((r) => r.label),
                y: savingsChartData.map((r) => r.predicted),
                type: "bar",
                name: "Reporting Predicted",
                marker: { color: "#E65100" },
                text: savingsChartData.map((r) =>
                  r.predicted.toLocaleString("en", { maximumFractionDigits: 0 })
                ),
                textposition: "outside",
                textfont: { size: 9 },
              },
            ]}
            layout={{
              barmode: "group",
              height: 420,
              margin: { l: 60, r: 20, t: 30, b: savingsView === "day" ? 60 : 40 },
              xaxis: {
                title: { text: savingsView === "day" ? "Date" : savingsView === "year" ? "Year" : "Month" },
                tickangle: savingsView === "day" ? -45 : 0,
              },
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
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Reporting Actual"
          value={`${Number(savings.reporting_actual_kwh).toLocaleString()} kWh`}
          variant="info"
        />
        <MetricCard
          label="Reporting Predicted"
          value={`${Number(savings.reporting_predicted_kwh).toLocaleString()} kWh`}
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
