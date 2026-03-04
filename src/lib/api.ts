// ============================================================================
// API Client — communicates with the FastAPI backend
// ============================================================================

import type {
  MeterListResponse,
  MeterDataResponse,
  AnalysisRequest,
  AnalysisResponse,
} from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchJSON<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

export async function fetchMeters(): Promise<MeterListResponse> {
  return fetchJSON<MeterListResponse>(`${API_URL}/api/meters`);
}

export async function fetchMeterData(
  meter: string
): Promise<MeterDataResponse> {
  return fetchJSON<MeterDataResponse>(
    `${API_URL}/api/meters/${encodeURIComponent(meter)}`
  );
}

export async function fetchFeatures(): Promise<{
  weather: string[];
  time: string[];
  all: string[];
}> {
  return fetchJSON(`${API_URL}/api/features`);
}

export async function runAnalysis(
  req: AnalysisRequest
): Promise<AnalysisResponse> {
  return fetchJSON<AnalysisResponse>(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
}
