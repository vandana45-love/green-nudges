"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getSurvey } from "@/lib/firestore";
import CategoryCard from "@/components/CategoryCard";
import NormChart from "@/components/NormChart";

const SPARK = [{ v: 70 }, { v: 65 }, { v: 80 }, { v: 60 }, { v: 55 }, { v: 50 }, { v: 48 }];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [survey, setSurvey] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading || !user) return;
    getSurvey(user.uid).then((s) => {
      if (!s) {
        router.replace("/onboarding");
        return;
      }
      setSurvey(s);
      setFetching(false);
    });
  }, [user, loading, router]);

  if (fetching) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;
  if (!survey) return null;

  const monthly = {
    transport_kg: Math.round(survey.transportKg / 12),
    energy_kg: Math.round(survey.energyKg / 12),
    food_kg: Math.round(survey.foodKg / 12),
    shopping_kg: Math.round(survey.shoppingKg / 12),
    total_kg: Math.round(survey.baselineKg / 12),
  };

  const CARDS = [
    { icon: "🚗", label: "Transport", kg: monthly.transport_kg },
    { icon: "⚡", label: "Energy",    kg: monthly.energy_kg },
    { icon: "🍽️", label: "Food",      kg: monthly.food_kg },
    { icon: "🛍️", label: "Shopping",  kg: monthly.shopping_kg },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Your Carbon Dashboard</h1>
        <p className="text-gray-500 mt-1">Monthly emissions overview</p>
      </div>

      <div className="bg-brand-600 text-white rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-brand-100 text-sm">Monthly total</p>
          <p className="text-4xl font-bold mt-1">{monthly.total_kg.toLocaleString()} <span className="text-xl font-normal">kg CO₂</span></p>
        </div>
        <div className="text-right">
          <p className="text-brand-100 text-sm">Annual baseline</p>
          <p className="text-2xl font-bold">{(survey.baselineKg / 1000).toFixed(1)} <span className="text-base font-normal">tons</span></p>
          <p className="text-brand-200 text-sm mt-1">Powered by Google Gemini 🤖</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {CARDS.map(c => <CategoryCard key={c.label} {...c} colorClass="" sparkData={SPARK} />)}
      </div>

      <NormChart userKg={monthly.total_kg} />
    </div>
  );
}
