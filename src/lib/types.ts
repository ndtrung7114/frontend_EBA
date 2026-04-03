// ============================================================================
// API Types — mirrors the backend Pydantic schemas
// ============================================================================

export interface MeterInfo {
  meter: string;
  group: string;
  site: string;
  building_type: string;
  total_days: number;
  min_date: string;
  max_date: string;
  avg_daily_kwh: number;
}

export interface MeterListResponse {
  meters: MeterInfo[];
  total: number;
  groups: string[];
}

export interface MeterDataPoint {
  date: string;
  daily_kwh: number;
}

export interface MeterDataResponse {
  meter: string;
  group: string;
  site: string;
  building_type: string;
  min_date: string;
  max_date: string;
  total_days: number;
  data: MeterDataPoint[];
  features: string[];
}

export interface TimeSeriesPoint {
  date: string;
  actual: number;
  predicted: number;
}

export interface TrainingResult {
  metrics: Record<string, number | string>;
  days: number;
  outlier_stats: Record<string, number>;
  data: TimeSeriesPoint[];
}

export interface ReportingResult {
  metrics: Record<string, number | string>;
  days: number;
  data: TimeSeriesPoint[];
  savings_daily: number[];
  cumulative_savings: number[];
}

export interface BaselineResult {
  days: number;
  data: TimeSeriesPoint[];
}

export interface FormulaResult {
  standardized: string;
  original_scale: string;
  excel: string;
  coefficients: Record<string, number>;
  original_coefficients: Record<string, number>;
  intercept: number;
  original_intercept: number;
}

export interface DriverRow {
  feature: string;
  training_avg: number;
  reporting_avg: number;
  change: number;
  coefficient: number;
  energy_impact: number;
  direction: string;
}

export interface MonthlyContribution {
  month: string;
  contributions: Record<string, number>;
  total_predicted: number;
}

export interface DriverResult {
  drivers: DriverRow[];
  monthly_contributions: MonthlyContribution[];
}

export interface YoYMonth {
  month: string;
  month_num: number;
  baseline_actual?: number | null;
  reporting_actual?: number | null;
  savings_kwh?: number | null;
  savings_pct?: number | null;
}

export interface YoYResult {
  months: YoYMonth[];
  totals: Record<string, number | null>;
}

export interface MonthlySavingsRow {
  month: string;
  actual: number;      // actual usage from DB in reporting period
  predicted: number;   // model-predicted (normalized) usage
  savings: number;     // actual - predicted
  savings_pct: number;
}

export interface AnalysisResponse {
  meter: string;
  group: string;
  site: string;
  building_type: string;
  model_info: Record<string, string | number>;
  training: TrainingResult;
  reporting: ReportingResult;
  baseline: BaselineResult | null;
  savings: Record<string, number>;
  formula: FormulaResult;
  drivers: DriverResult;
  yoy: YoYResult | null;
  monthly_savings: MonthlySavingsRow[];
  features_used: string[];
}

export interface AnalysisRequest {
  meter: string;
  rp_start: string;
  rp_end: string;
  baseline_enabled: boolean;
  bl_start?: string;
  bl_end?: string;
  tr_start?: string;
  tr_end?: string;
  training_mode: "all" | "custom" | "sync_baseline";
  features?: string[];
  use_iqr: boolean;
  iqr_k: number;
  use_interpolated?: boolean;
}

// ── UI State Types ──

export type TabId =
  | "overview"
  | "results"
  | "formula"
  | "drivers"
  | "yoy";

export interface TabItem {
  id: TabId;
  label: string;
  icon: string;
}

export const TABS: TabItem[] = [
  { id: "overview", label: "Data Overview", icon: "📈" },
  { id: "results", label: "Results", icon: "🧪" },
  { id: "formula", label: "Regression Formula", icon: "📐" },
  { id: "drivers", label: "Driver Analysis", icon: "🔍" },
  { id: "yoy", label: "Year-over-Year", icon: "📅" },
];
