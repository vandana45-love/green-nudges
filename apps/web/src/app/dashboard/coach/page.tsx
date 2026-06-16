"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getRecommendations } from "@/lib/firestore";
import type { RecommendationItem } from "@/lib/firestore";

const META: Record<string, { icon: string; color: string }> = {
  transport: { icon: "🚗", color: "bg-blue-50 border-blue-100" },
  energy:    { icon: "⚡", color: "bg-yellow-50 border-yellow-100" },
  food:      { icon: "🍽️", color: "bg-orange-50 border-orange-100" },
  shopping:  { icon: "🛍️", color: "bg-purple-50 border-purple-100" },
  general:   { icon: "🌿", color: "bg-brand-50 border-brand-100" },
};

export default function CoachPage() {
  const { user, loading } = useAuth();
  const [recs, setRecs] = useState<RecommendationItem[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading || !user) return;
    getRecommendations(user.uid).then((items) => {
      setRecs(items);
      setFetching(false);
    });
  }, [user, loading]);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Coach</h1>
        <p className="text-gray-500 mt-1">Personalised recommendations by Google Gemini</p>
      </div>

      {fetching ? (
        <div className="text-gray-400 py-8 text-center">Loading…</div>
      ) : recs.length === 0 ? (
        <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">
          <p className="text-4xl mb-3">🌱</p>
          <p>Complete your survey to get recommendations.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recs.map((r: RecommendationItem, i: number) => {
            const m = META[r.category] ?? META.general;
            return (
              <div key={i} className={`rounded-2xl border p-5 space-y-2 ${m.color}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{m.icon}</span>
                    <span className="text-xs font-semibold uppercase text-gray-500">{r.category}</span>
                  </div>
                  <span className="text-green-600 font-bold text-sm">-{Number(r.savingsKg).toFixed(0)} kg CO₂/yr</span>
                </div>
                <p className="text-gray-800">{r.message}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
