"use client";

import { useState } from "react";

interface Lever {
  id: string;
  icon: string;
  label: string;
  description: string;
  minLabel: string;
  maxLabel: string;
  value: number;
  maxSaving: number;
}

const INITIAL_LEVERS: Lever[] = [
  { id: "transport", icon: "🚗", label: "Transport Mode", description: "Shift from car to public transport", minLabel: "Car only", maxLabel: "Public transport", value: 0, maxSaving: 60 },
  { id: "food", icon: "🍽️", label: "Meat-free Days", description: "Replace meat meals with plant-based", minLabel: "0 days/week", maxLabel: "7 days/week", value: 0, maxSaving: 80 },
  { id: "energy", icon: "💡", label: "Home Energy", description: "LED lighting + smart thermostat", minLabel: "No changes", maxLabel: "Full efficiency", value: 0, maxSaving: 45 },
  { id: "ev", icon: "⚡", label: "Switch to EV", description: "Replace ICE car with electric vehicle", minLabel: "ICE car", maxLabel: "Full EV", value: 0, maxSaving: 200 },
  { id: "shopping", icon: "🛍️", label: "Conscious Shopping", description: "Reduce fast fashion, buy second-hand", minLabel: "No change", maxLabel: "Minimal new purchases", value: 0, maxSaving: 40 },
];

const CURRENT_ANNUAL = 8200;

export default function PlannerPage() {
  const [levers, setLevers] = useState<Lever[]>(INITIAL_LEVERS);

  const totalSaving = levers.reduce((sum, l) => sum + (l.maxSaving * l.value) / 100, 0);
  const projected = Math.max(0, CURRENT_ANNUAL - totalSaving * 12);
  const reductionPct = Math.round((totalSaving * 12 / CURRENT_ANNUAL) * 100);

  function updateLever(id: string, value: number) {
    setLevers(prev => prev.map(l => l.id === id ? { ...l, value } : l));
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Decarbonisation Planner</h1>
        <p className="text-gray-500 mt-1">Drag the levers to see your potential impact</p>
      </div>

      {/* Projection banner */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex gap-8">
        <div>
          <p className="text-sm text-gray-500">Current annual</p>
          <p className="text-2xl font-bold text-gray-700">{(CURRENT_ANNUAL / 1000).toFixed(1)} <span className="text-base font-normal">tons</span></p>
        </div>
        <div className="border-l border-gray-100 pl-8">
          <p className="text-sm text-gray-500">Projected annual</p>
          <p className="text-2xl font-bold text-brand-600">{(projected / 1000).toFixed(1)} <span className="text-base font-normal">tons</span></p>
        </div>
        {reductionPct > 0 && (
          <div className="border-l border-gray-100 pl-8">
            <p className="text-sm text-gray-500">Reduction</p>
            <p className="text-2xl font-bold text-green-600">-{reductionPct}%</p>
          </div>
        )}
      </div>

      {/* Levers */}
      <div className="space-y-5">
        {levers.map(l => {
          const saving = (l.maxSaving * l.value) / 100;
          return (
            <div key={l.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{l.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-800">{l.label}</p>
                    <p className="text-xs text-gray-500">{l.description}</p>
                  </div>
                </div>
                {saving > 0 && (
                  <span className="text-green-600 font-semibold text-sm">-{saving.toFixed(0)} kg/mo</span>
                )}
              </div>
              <div className="space-y-1">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={l.value}
                  onChange={e => updateLever(l.id, +e.target.value)}
                  className="w-full accent-brand-500"
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{l.minLabel}</span>
                  <span>{l.maxLabel}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
