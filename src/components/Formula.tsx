"use client";

import dynamic from "next/dynamic";
import type { AnalysisResponse } from "@/lib/types";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Props {
  result: AnalysisResponse;
}

const BOOLEAN_FEATURES = new Set(["is_weekend", "is_holiday"]);

const FEATURE_UNITS: Record<string, string> = {
  maxtempC: "°C", mintempC: "°C", avgtempC: "°C",
  HeatIndexC: "°C", WindChillC: "°C", FeelsLikeC: "°C",
  humidity: "%", sunHour: "hr", uvIndex: "",
  windspeedKmph: "km/h", pressure: "hPa", winddirDegree: "°",
  visibility: "km", cloudcover: "%", WindGustKmph: "km/h",
  month: "", month_day: "", week_day: "", season: "",
  is_weekend: "", is_holiday: "",
};

export default function Formula({ result }: Props) {
  const { formula, features_used } = result;
  const coefEntries = Object.entries(formula.coefficients).filter(
    ([, v]) => Math.abs(v) > 1e-8
  );
  const sortedByAbs = [...coefEntries].sort((a, b) => Math.abs(a[1]) - Math.abs(b[1]));

  // Features removed by ElasticNet (zero coefficient)
  const keptFeatures = new Set(coefEntries.map(([f]) => f));
  const removedFeatures = features_used.filter((f) => !keptFeatures.has(f));

  // Lookup map: feature → driver row (has training_avg & reporting_avg)
  const driverMap = Object.fromEntries(
    result.drivers.drivers.map((d) => [d.feature, d])
  );

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

      {/* Removed Features */}
      {removedFeatures.length > 0 && (
        <div className="card overflow-hidden">
          <div className="card-header bg-amber-50 border-b border-amber-100">
            <h3 className="text-sm font-semibold text-amber-700">
              ✂️ Features Removed by ElasticNet ({removedFeatures.length} of {features_used.length})
            </h3>
          </div>
          <div className="p-4">
            <p className="text-xs text-gray-500 mb-3">
              These features were shrunk to zero coefficient by the ElasticNet regularization — they had no predictive value for this meter and were excluded from the model.
            </p>
            <div className="flex flex-wrap gap-2">
              {removedFeatures.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Coefficient Interpretation */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="text-sm font-semibold text-gray-700">
            📖 Coefficient Interpretation
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {Object.entries(formula.original_coefficients)
            .filter(([, v]) => Math.abs(v) > 1e-8)
            .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
            .map(([feat, coef]) => {
              const isBoolean = BOOLEAN_FEATURES.has(feat);
              const unit = FEATURE_UNITS[feat];
              const driver = driverMap[feat];
              const trMean = driver?.training_avg;
              const rpMean = driver?.reporting_avg;

              // Part 1
              const coefStr = (coef >= 0 ? "+" : "") + coef.toFixed(4);
              const direction = coef >= 0 ? "higher" : "lower";
              const part1 = isBoolean
                ? `When ${feat} = 1 (active), modeled usage is ${coefStr} kWh/day ${direction} than when ${feat} = 0 (inactive), assuming other factors remain unchanged.`
                : `When ${feat} increases by 1${unit ? " " + unit : " unit"}, modeled usage changes by ${coefStr} kWh/day, assuming other factors remain unchanged.`;

              // Part 2
              let part2 = "";
              if (trMean !== undefined && rpMean !== undefined) {
                const scale = Math.max(Math.abs(trMean), Math.abs(rpMean), 1);
                const approxEqual = Math.abs(rpMean - trMean) / scale < 0.02;
                const coefRoundsToZero = Math.round(coef * 100) / 100 === 0;

                if (coefRoundsToZero || approxEqual) {
                  part2 = isBoolean
                    ? "Compared with the Training Period, this factor is active at a similar level in the Reporting Period, so its visible adjustment pressure on modeled usage is limited."
                    : "Compared with the Training Period, this factor is in a similar range in the Reporting Period, so its visible adjustment pressure on modeled usage is limited.";
                } else if (isBoolean) {
                  if (coef > 0 && rpMean > trMean)
                    part2 = "Compared with the Training Period, this factor is active more often in the Reporting Period, which suggests upward adjustment pressure on modeled usage.";
                  else if (coef > 0 && rpMean < trMean)
                    part2 = "Compared with the Training Period, this factor is active less often in the Reporting Period, which suggests downward adjustment pressure on modeled usage.";
                  else if (coef < 0 && rpMean > trMean)
                    part2 = "Compared with the Training Period, this factor is active more often in the Reporting Period, which suggests downward adjustment pressure on modeled usage.";
                  else if (coef < 0 && rpMean < trMean)
                    part2 = "Compared with the Training Period, this factor is active less often in the Reporting Period, which suggests upward adjustment pressure on modeled usage.";
                } else {
                  if (coef > 0 && rpMean > trMean)
                    part2 = "Compared with the Training Period, the average factor level is higher in the Reporting Period, which suggests upward adjustment pressure on modeled usage.";
                  else if (coef > 0 && rpMean < trMean)
                    part2 = "Compared with the Training Period, the average factor level is lower in the Reporting Period, which suggests downward adjustment pressure on modeled usage.";
                  else if (coef < 0 && rpMean > trMean)
                    part2 = "Compared with the Training Period, the average factor level is higher in the Reporting Period, which suggests downward adjustment pressure on modeled usage.";
                  else if (coef < 0 && rpMean < trMean)
                    part2 = "Compared with the Training Period, the average factor level is lower in the Reporting Period, which suggests upward adjustment pressure on modeled usage.";
                }
              }

              return (
                <div key={feat} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-semibold text-sm text-gray-900">{feat}</span>
                    <span className={`font-mono text-sm ${coef >= 0 ? "text-green-700" : "text-red-700"}`}>
                      {(coef >= 0 ? "+" : "") + coef.toFixed(4)}
                    </span>
                    {isBoolean && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">
                        Boolean
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700">{part1}</p>
                  {part2 && (
                    <p className="text-xs text-gray-500 mt-1">{part2}</p>
                  )}
                </div>
              );
            })}
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
