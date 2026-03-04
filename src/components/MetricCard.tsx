"use client";

import { clsx } from "clsx";

interface Props {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "success" | "danger" | "info";
}

const borderColors = {
  default: "border-l-gray-300",
  success: "border-l-green-500",
  danger: "border-l-red-500",
  info: "border-l-blue-500",
};

export default function MetricCard({
  label,
  value,
  subtitle,
  trend,
  variant = "default",
}: Props) {
  return (
    <div
      className={clsx(
        "metric-card border-l-4 animate-fade-in",
        borderColors[variant]
      )}
    >
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-xl font-bold text-gray-900 tracking-tight">{value}</p>
      {subtitle && (
        <p
          className={clsx(
            "text-xs font-medium",
            trend === "up"
              ? "text-green-600"
              : trend === "down"
              ? "text-red-600"
              : "text-gray-500"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
