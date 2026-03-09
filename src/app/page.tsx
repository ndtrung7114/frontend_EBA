"use client";

import { useState, useEffect, useCallback } from "react";
import { clsx } from "clsx";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import DataOverview from "@/components/DataOverview";
import Results from "@/components/Results";
import Formula from "@/components/Formula";
import DriverAnalysis from "@/components/DriverAnalysis";
import YearOverYear from "@/components/YearOverYear";
import { fetchMeters, fetchMeterData, runAnalysis } from "@/lib/api";
import type {
  MeterInfo,
  MeterDataResponse,
  AnalysisRequest,
  AnalysisResponse,
  TabId,
} from "@/lib/types";
import { TABS } from "@/lib/types";
import {
  BarChart3,
  FlaskConical,
  FunctionSquare,
  Search,
  CalendarDays,
  Menu,
  X as XIcon,
} from "lucide-react";

const TAB_ICONS: Record<TabId, React.ReactNode> = {
  overview: <BarChart3 className="w-4 h-4" />,
  results: <FlaskConical className="w-4 h-4" />,
  formula: <FunctionSquare className="w-4 h-4" />,
  drivers: <Search className="w-4 h-4" />,
  yoy: <CalendarDays className="w-4 h-4" />,
};

export default function Home() {
  // ── State ──
  const [meters, setMeters] = useState<MeterInfo[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [selectedMeter, setSelectedMeter] = useState("");
  const [meterData, setMeterData] = useState<MeterDataResponse | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Last-used sidebar settings for DataOverview (we extract from the last request)
  const [lastRequest, setLastRequest] = useState<AnalysisRequest | null>(null);

  // ── Load meter list on mount ──
  useEffect(() => {
    fetchMeters()
      .then((res) => {
        setMeters(res.meters);
        setGroups(res.groups || []);
        if (res.meters.length > 0) {
          setSelectedMeter(res.meters[0].meter);
        }
      })
      .catch((e) => setError(e.message));
  }, []);

  // ── Load meter data when selection changes ──
  useEffect(() => {
    if (!selectedMeter) return;
    setResult(null);
    fetchMeterData(selectedMeter)
      .then(setMeterData)
      .catch((e) => setError(e.message));
  }, [selectedMeter]);

  // ── Run analysis ──
  const handleRun = useCallback(async (req: AnalysisRequest) => {
    setLoading(true);
    setError(null);
    setLastRequest(req);
    try {
      const res = await runAnalysis(req);
      setResult(res);
      setActiveTab("results");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Derive DataOverview period props ──
  const rpStartStr = lastRequest?.rp_start || (meterData ? midpoint(meterData.min_date, meterData.max_date) : "");
  const deriveTrainingEnd = () => {
    if (lastRequest?.training_mode === "custom" && lastRequest?.tr_end) return lastRequest.tr_end;
    if (lastRequest?.training_mode === "sync_baseline" && lastRequest?.bl_end) return lastRequest.bl_end;
    // "all" mode or default: use day before reporting start
    if (rpStartStr) return oneDayBefore(rpStartStr);
    return meterData?.max_date || "";
  };
  const baselineEnabled = lastRequest?.baseline_enabled ?? true;
  const overviewProps = {
    rpStart: rpStartStr,
    rpEnd: lastRequest?.rp_end || meterData?.max_date || "",
    blStart: baselineEnabled ? (lastRequest?.bl_start || meterData?.min_date || "") : "",
    blEnd: baselineEnabled ? (lastRequest?.bl_end || (meterData ? midpoint(meterData.min_date, meterData.max_date) : "")) : "",
    trStart: lastRequest?.training_mode === "custom"
      ? (lastRequest?.tr_start || meterData?.min_date || "")
      : lastRequest?.training_mode === "sync_baseline"
      ? (lastRequest?.bl_start || meterData?.min_date || "")
      : meterData?.min_date || "",
    trEnd: deriveTrainingEnd(),
    baselineEnabled,
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-brand-600 text-white rounded-full shadow-xl hover:bg-brand-700 transition"
        >
          {sidebarOpen ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Sidebar */}
        <div
          className={clsx(
            "fixed top-0 left-0 h-screen lg:relative lg:top-auto lg:left-auto lg:h-auto z-40 transition-transform duration-300",
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0 lg:hidden"
          )}
        >
          <Sidebar
            meters={meters}
            groups={groups}
            selectedMeter={selectedMeter}
            meterData={meterData}
            onMeterChange={setSelectedMeter}
            onRun={handleRun}
            loading={loading}
          />
        </div>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-[1200px] mx-auto p-4 sm:p-6">
            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6 bg-white rounded-xl p-1.5 shadow-sm border border-gray-200 overflow-x-auto">
              {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={clsx(
                      "tab-btn flex items-center gap-2 whitespace-nowrap",
                      activeTab === tab.id
                        ? "tab-btn-active"
                        : "tab-btn-inactive"
                    )}
                  >
                    {TAB_ICONS[tab.id]}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                <strong>Error:</strong> {error}
                <button
                  onClick={() => setError(null)}
                  className="ml-3 text-red-600 hover:text-red-800 underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700">
                      Running ElasticNet Analysis...
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Training model and computing metrics
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content */}
            {!loading && (
              <>
                {activeTab === "overview" && meterData && (
                  <DataOverview
                    meterData={meterData}
                    rpStart={overviewProps.rpStart}
                    rpEnd={overviewProps.rpEnd}
                    blStart={overviewProps.blStart}
                    blEnd={overviewProps.blEnd}
                    trStart={overviewProps.trStart}
                    trEnd={overviewProps.trEnd}
                    baselineEnabled={overviewProps.baselineEnabled}
                  />
                )}

                {activeTab === "results" && !result && (
                  <EmptyState
                    icon="🧪"
                    title="No Results Yet"
                    message="Configure your settings in the sidebar and click Run Analysis to see results."
                  />
                )}
                {activeTab === "results" && result && (
                  <Results result={result} />
                )}

                {activeTab === "formula" && !result && (
                  <EmptyState
                    icon="📐"
                    title="No Formula Available"
                    message="Run an analysis first to see the regression formula."
                  />
                )}
                {activeTab === "formula" && result && (
                  <Formula result={result} />
                )}

                {activeTab === "drivers" && !result && (
                  <EmptyState
                    icon="🔍"
                    title="No Driver Analysis"
                    message="Run an analysis first to see feature driver contributions."
                  />
                )}
                {activeTab === "drivers" && result && (
                  <DriverAnalysis result={result} />
                )}

                {activeTab === "yoy" && !result && (
                  <EmptyState
                    icon="📅"
                    title="No Year-over-Year Data"
                    message="Run an analysis with a baseline period enabled to see YoY comparisons."
                  />
                )}
                {activeTab === "yoy" && result && !result.yoy && (
                  <EmptyState
                    icon="📅"
                    title="Baseline Disabled"
                    message="Enable the baseline period in the sidebar and re-run the analysis to see Year-over-Year comparisons."
                  />
                )}
                {activeTab === "yoy" && result && result.yoy && (
                  <YearOverYear result={result} />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Empty state component ──

function EmptyState({
  icon,
  title,
  message,
}: {
  icon: string;
  title: string;
  message: string;
}) {
  return (
    <div className="card p-12 text-center animate-fade-in">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto">{message}</p>
    </div>
  );
}

function midpoint(a: string, b: string): string {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return new Date((da + db) / 2).toISOString().slice(0, 10);
}

function oneDayBefore(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
