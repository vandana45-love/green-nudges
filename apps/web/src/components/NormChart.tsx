"use client";

interface Props {
  userKg: number;
  avgKg?: number;
  nationalKg?: number;
}

interface BarProps {
  label: string;
  value: number;
  max: number;
  highlight?: boolean;
}

function Bar({ label, value, max, highlight }: BarProps) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className={highlight ? "font-semibold text-brand-700" : "text-gray-600"}>
          {label}
        </span>
        <span className="text-gray-700 font-medium" aria-label={`${value.toLocaleString()} kilograms CO2`}>
          {value.toLocaleString()} kg
        </span>
      </div>
      <div
        className="h-3 bg-gray-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={Math.round(max)}
        aria-label={`${label}: ${value.toLocaleString()} kg CO2`}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ${highlight ? "bg-brand-500" : "bg-gray-300"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function NormChart({ userKg, avgKg = 710, nationalKg = 780 }: Props) {
  const max = Math.max(userKg, avgKg, nationalKg) * 1.1;
  return (
    <section
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4"
      aria-label="Carbon footprint comparison chart"
    >
      <h3 className="font-semibold text-gray-800">How you compare</h3>
      <Bar label="You" value={userKg} max={max} highlight />
      <Bar label="Average users" value={avgKg} max={max} />
      <Bar label="National average" value={nationalKg} max={max} />
      <p className="text-xs text-gray-400">Monthly kg CO₂ · Based on aggregated anonymised data</p>
    </section>
  );
}
