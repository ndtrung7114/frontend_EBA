"use client";

import { clsx } from "clsx";
import {
  Settings,
  Calendar,
  Target,
  Brain,
  Wrench,
  Play,
  ChevronDown,
  ChevronUp,
  Building2,
  MapPin,
} from "lucide-react";
import type { MeterInfo, MeterDataResponse, AnalysisRequest } from "@/lib/types";
import { useState, useEffect, useMemo } from "react";

interface Props {
  meters: MeterInfo[];
  groups: string[];
  selectedMeter: string;
  meterData: MeterDataResponse | null;
  onMeterChange: (meter: string) => void;
  onRun: (req: AnalysisRequest) => void;
  loading: boolean;
}

export default function Sidebar({
  meters,
  groups,
  selectedMeter,
  meterData,
  onMeterChange,
  onRun,
  loading,
}: Props) {
  const info = meters.find((m) => m.meter === selectedMeter);

  // Group filter
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const filteredMeters = useMemo(() => {
    if (selectedGroup === "all") return meters;
    return meters.filter((m) => m.group === selectedGroup);
  }, [meters, selectedGroup]);

  // When group changes, select first meter in filtered list
  useEffect(() => {
    if (filteredMeters.length > 0 && !filteredMeters.find(m => m.meter === selectedMeter)) {
      onMeterChange(filteredMeters[0].meter);
    }
  }, [filteredMeters, selectedMeter, onMeterChange]);

  // Dates
  const minDate = meterData?.min_date || "";
  const maxDate = meterData?.max_date || "";
  const midDate = minDate && maxDate
    ? midpoint(minDate, maxDate)
    : "";

  // Period state
  const [rpStart, setRpStart] = useState(midDate);
  const [rpEnd, setRpEnd] = useState(maxDate);
  const [baselineEnabled, setBaselineEnabled] = useState(true);
  const [blStart, setBlStart] = useState(minDate);
  const [blEnd, setBlEnd] = useState(midDate);
  const [trainingMode, setTrainingMode] = useState<"all" | "custom" | "sync_baseline">("all");
  const [trStart, setTrStart] = useState(minDate);
  const [trEnd, setTrEnd] = useState(maxDate);
  const [useIqr, setUseIqr] = useState(true);
  const [iqrK, setIqrK] = useState(1.5);
  const [useInterpolated, setUseInterpolated] = useState(false);
  const hasInterpolated = info?.group === "IKEA";
  const allHistoryEnd = rpStart ? oneDayBefore(rpStart) : "";

  // Feature selection
  const [showFeatures, setShowFeatures] = useState(false);
  const allFeatures = meterData?.features || [];
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(allFeatures);

  // Update defaults when meter data changes
  useEffect(() => {
    if (meterData) {
      const mid = midpoint(meterData.min_date, meterData.max_date);
      setRpStart(mid);
      setRpEnd(meterData.max_date);
      setBlStart(meterData.min_date);
      setBlEnd(mid);
      setTrStart(meterData.min_date);
      setTrEnd(meterData.max_date);
      setSelectedFeatures(meterData.features);
    }
  }, [meterData]);

  const handleRun = () => {
    const req: AnalysisRequest = {
      meter: selectedMeter,
      rp_start: rpStart,
      rp_end: rpEnd,
      baseline_enabled: baselineEnabled,
      training_mode: trainingMode,
      features: selectedFeatures.length === allFeatures.length ? undefined : selectedFeatures,
      use_iqr: useIqr,
      iqr_k: iqrK,
      use_interpolated: hasInterpolated ? useInterpolated : undefined,
    };
    if (baselineEnabled) {
      req.bl_start = blStart;
      req.bl_end = blEnd;
    }
    if (trainingMode === "custom") {
      req.tr_start = trStart;
      req.tr_end = trEnd;
    }
    onRun(req);
  };

  const toggleFeature = (f: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  return (
    <aside className="w-80 h-screen lg:h-full flex flex-col flex-shrink-0 bg-white border-r border-gray-200">
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2 text-gray-700">
          <Settings className="w-4 h-4" />
          <h2 className="text-sm font-bold uppercase tracking-wider">Configuration</h2>
        </div>

        {/* Data Group Selection */}
        <Section icon={<Building2 className="w-4 h-4" />} title="Data Group">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="select-field mb-2"
          >
            <option value="all">All Groups ({meters.length})</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g} ({meters.filter((m) => m.group === g).length})
              </option>
            ))}
          </select>
        </Section>

        {/* Meter Selection */}
        <Section icon={<MapPin className="w-4 h-4" />} title="Meter">
          <select
            value={selectedMeter}
            onChange={(e) => onMeterChange(e.target.value)}
            className="select-field"
          >
            {filteredMeters.map((m) => (
              <option key={m.meter} value={m.meter}>
                {m.meter} ({m.site} / {m.building_type})
              </option>
            ))}
          </select>
          {info && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              <span>
                {info.site} &middot; {info.building_type} &middot; {info.total_days} days
              </span>
            </div>
          )}
        </Section>

        {/* Features */}
        <Section icon={<Wrench className="w-3.5 h-3.5" />} title="Features">
          <button
            onClick={() => setShowFeatures(!showFeatures)}
            className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <span className="text-gray-700">
              {selectedFeatures.length}/{allFeatures.length} features
            </span>
            {showFeatures ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {showFeatures && (
            <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-0.5">
              {allFeatures.map((f) => (
                <label
                  key={f}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(f)}
                    onChange={() => toggleFeature(f)}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-xs text-gray-700">{f}</span>
                </label>
              ))}
            </div>
          )}
        </Section>

        <hr className="border-gray-100" />

        {/* Reporting Period */}
        <Section icon={<Target className="w-4 h-4 text-green-600" />} title="Reporting Period">
          <p className="text-[11px] text-gray-500 mb-2">
            Target period for savings calculation
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Start</label>
              <input
                type="date"
                value={rpStart}
                min={minDate}
                max={maxDate}
                onChange={(e) => setRpStart(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">End</label>
              <input
                type="date"
                value={rpEnd}
                min={minDate}
                max={maxDate}
                onChange={(e) => setRpEnd(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </Section>

        {/* Baseline Period */}
        <Section icon={<Calendar className="w-4 h-4 text-orange-500" />} title="Baseline Period">
          <label className="flex items-center gap-2 cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={baselineEnabled}
              onChange={(e) => setBaselineEnabled(e.target.checked)}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-xs text-gray-700">Enable baseline comparison</span>
          </label>
          {baselineEnabled && (
            <>
              <p className="text-[11px] text-gray-500 mb-2">
                Historical reference period for savings comparison
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Start</label>
                  <input
                    type="date"
                    value={blStart}
                    min={minDate}
                    max={maxDate}
                    onChange={(e) => setBlStart(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">End</label>
                  <input
                    type="date"
                    value={blEnd}
                    min={minDate}
                    max={maxDate}
                    onChange={(e) => setBlEnd(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </>
          )}
        </Section>

        {/* Training Period */}
        <Section icon={<Brain className="w-4 h-4 text-blue-600" />} title="Training Period">
          <p className="text-[11px] text-gray-500 mb-2">
            Data the model learns from
          </p>
          <div className="space-y-1.5">
            {(["all", "custom", "sync_baseline"] as const).map((mode) => (
              <label
                key={mode}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition",
                  trainingMode === mode
                    ? "border-brand-300 bg-brand-50"
                    : "border-transparent hover:bg-gray-50"
                )}
              >
                <input
                  type="radio"
                  name="training_mode"
                  value={mode}
                  checked={trainingMode === mode}
                  onChange={() => setTrainingMode(mode)}
                  className="text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs text-gray-700">
                  {mode === "all"
                    ? "All History"
                    : mode === "custom"
                    ? "Custom Range"
                    : "Sync with Baseline"}
                </span>
              </label>
            ))}
          </div>
          {trainingMode === "custom" && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="label">Start</label>
                <input
                  type="date"
                  value={trStart}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => setTrStart(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">End</label>
                <input
                  type="date"
                  value={trEnd}
                  min={minDate}
                  max={maxDate}
                  onChange={(e) => setTrEnd(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          )}
          {trainingMode === "all" && (
            <p className="text-[11px] text-gray-400 mt-1.5">
              Using all data before reporting start: {minDate} → {allHistoryEnd || "N/A"}
            </p>
          )}
          {trainingMode === "sync_baseline" && (
            <p className="text-[11px] text-gray-400 mt-1.5">
              Synced: {blStart} → {blEnd}
            </p>
          )}
        </Section>

        {/* Outlier Removal */}
        <Section icon={<Wrench className="w-4 h-4 text-gray-500" />} title="Outlier Removal">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useIqr}
              onChange={(e) => setUseIqr(e.target.checked)}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-xs text-gray-700">Enable IQR filtering</span>
          </label>
          {useIqr && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-gray-600">IQR multiplier (k)</label>
                <span className="text-xs font-mono text-brand-700">{iqrK.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.1"
                value={iqrK}
                onChange={(e) => setIqrK(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>1.0</span>
                <span>3.0</span>
              </div>
            </div>
          )}
        </Section>

        {/* Interpolated Value — only for meters that have this column (IKEA) */}
        {hasInterpolated && (
          <Section icon={<Wrench className="w-4 h-4 text-purple-500" />} title="Usage Source">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useInterpolated}
                onChange={(e) => setUseInterpolated(e.target.checked)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-xs text-gray-700">Use interpolated value</span>
            </label>
            <p className="text-[11px] text-gray-400 mt-1">
              {useInterpolated
                ? "Model trains on interpolated_value (gap-filled readings)"
                : "Model trains on raw usage_value"}
            </p>
          </Section>
        )}

      </div>

      <div className="p-4 border-t border-gray-100 bg-white">
        <button
          onClick={handleRun}
          disabled={loading || !selectedMeter}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Running Analysis...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Analysis
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

// ── Helpers ──

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function midpoint(a: string, b: string): string {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  const mid = new Date((da + db) / 2);
  return mid.toISOString().slice(0, 10);
}

function oneDayBefore(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}
