"use client";

import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  icon: string;
  label: string;
  kg: number;
  trend?: number | null;
  sparkData?: { v: number }[];
  colorClass: string;
}

export default function CategoryCard({ icon, label, kg, trend, sparkData, colorClass }: Props) {
  const trendColor = trend === undefined || trend === null ? "" : trend <= 0 ? "text-green-600" : "text-red-500";
  const trendSign = trend !== null && trend !== undefined ? (trend <= 0 ? "↓" : "↑") : "";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <span className="text-sm font-medium text-gray-600">{label}</span>
        </div>
        {trend !== null && trend !== undefined && (
          <span className={`text-xs font-semibold ${trendColor}`}>
            {trendSign} {Math.abs(trend)}% this month
          </span>
        )}
      </div>

      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-gray-900">{kg.toLocaleString()}</span>
        <span className="text-sm text-gray-400">kg CO₂</span>
      </div>

      {sparkData && sparkData.length > 0 && (
        <ResponsiveContainer width="100%" height={40}>
          <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip
              contentStyle={{ fontSize: 11, padding: "2px 6px" }}
              formatter={(v: number) => [`${v} kg`, ""]}
              labelFormatter={() => ""}
            />
            <Area type="monotone" dataKey="v" stroke="#22c55e" strokeWidth={2} fill={`url(#grad-${label})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
