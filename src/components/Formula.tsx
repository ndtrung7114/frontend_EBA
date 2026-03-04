"use client";

import dynamic from "next/dynamic";
import type { AnalysisResponse } from "@/lib/types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Props {
  result: AnalysisResponse;
}

export default function Formula({ result }: Props) {
  const { formula } = result;
  const coefEntries = Object.entries(formula.coefficients).filter(
    ([, v]) => Math.abs(v) > 1e-8
  );
  const sortedByAbs = [...coefEntries].sort((a, b) => Math.abs(a[1]) - Math.abs(b[1]));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-lg font-bold text-gray-900">
          📐 Regression Formula (White-Box Model)
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Transparent, defensible regression equation. Copy this formula into
          PowerPoint, Excel, or client reports.
        </p>
      </div>

      {/* Standardized Formula */}
      <div className="card overflow-hidden">
        <div className="card-header bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">
            🔢 Standardized Formula
          </h3>
        </div>
        <div className="card-body">
          <pre className="text-sm font-mono bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {formula.standardized}
          </pre>
        </div>
      </div>

      {/* Original-Scale Formula */}
      <div className="card overflow-hidden">
        <div className="card-header bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">
            📊 Original-Scale Formula (for Excel / PowerBI)
          </h3>
        </div>
        <div className="card-body">
          <pre className="text-sm font-mono bg-gray-900 text-blue-300 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {formula.original_scale}
          </pre>
        </div>
      </div>

      {/* Excel Formula */}
      <div className="card overflow-hidden">
        <div className="card-header bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">
            📋 Excel Formula (Copy-Paste)
          </h3>
        </div>
        <div className="card-body">
          <div className="relative">
            <pre className="text-sm font-mono bg-gray-900 text-amber-300 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {formula.excel}
            </pre>
            <button
              onClick={() => navigator.clipboard.writeText(formula.excel)}
              className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* Coefficient Bar Chart */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-gray-700">
            🔬 Feature Coefficients (Standardized)
          </h3>
        </div>
        <div className="p-2">
          <Plot
            data={[
              {
                y: sortedByAbs.map(([f]) => f),
                x: sortedByAbs.map(([, v]) => v),
                type: "bar",
                orientation: "h",
                marker: {
                  color: sortedByAbs.map(([, v]) =>
                    v >= 0 ? "#4CAF50" : "#F44336"
                  ),
                },
                text: sortedByAbs.map(([, v]) =>
                  (v >= 0 ? "+" : "") + v.toFixed(3)
                ),
                textposition: "auto",
                textfont: { size: 10 },
              },
            ]}
            layout={{
              height: Math.max(400, coefEntries.length * 28),
              margin: { l: 140, r: 40, t: 30, b: 40 },
              xaxis: { title: { text: "Coefficient" } },
              title: {
                text: `Intercept: ${formula.intercept.toFixed(4)}`,
                font: { size: 12 },
              },
              font: { family: "Inter, system-ui, sans-serif" },
            }}
            config={{ responsive: true, displayModeBar: false }}
            className="w-full"
          />
        </div>
      </div>

      {/* Coefficient Interpretation Table */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-gray-700">
            📖 Coefficient Interpretation
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">
                  Feature
                </th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">
                  Coefficient
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase">
                  Interpretation
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(formula.original_coefficients)
                .filter(([, v]) => Math.abs(v) > 1e-8)
                .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                .map(([feat, coef], i) => (
                  <tr
                    key={feat}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {feat}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      <span
                        className={
                          coef >= 0 ? "text-green-700" : "text-red-700"
                        }
                      >
                        {coef >= 0 ? "+" : ""}
                        {coef.toFixed(4)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600 text-xs">
                      +1 unit → {coef >= 0 ? "+" : ""}
                      {coef.toFixed(2)} kWh/day
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Download */}
      <div className="flex justify-end">
        <button
          onClick={() => downloadFormula(result)}
          className="btn-primary flex items-center gap-2"
        >
          📋 Download Formula (TXT)
        </button>
      </div>
    </div>
  );
}

function downloadFormula(result: AnalysisResponse) {
  const { formula, meter, model_info, features_used } = result;
  const text = `EBA Normalized Usage — Regression Formula
Meter: ${meter}
Model: ElasticNet
Features: ${features_used.length} (${
    Object.values(formula.coefficients).filter((v) => Math.abs(v) > 1e-8).length
  } non-zero)

Formula (original scale):
${formula.original_scale}

Excel formula:
${formula.excel}`;

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "eba_normalized_formula.txt";
  a.click();
  URL.revokeObjectURL(url);
}
