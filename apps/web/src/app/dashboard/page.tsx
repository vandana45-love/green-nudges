"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { fetchMonthly, fetchSurvey } from "@/lib/api";
import CategoryCard from "@/components/CategoryCard";
import NormChart from "@/components/NormChart";

const SPARK = [{ v: 70 }, { v: 65 }, { v: 80 }, { v: 60 }, { v: 55 }, { v: 50 }, { v: 48 }];

export default function DashboardPage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [survey, setSurvey] = useState<any>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.replace("/sign-in"); return; }
    getToken().then(async (token) => {
      if (!token) return;
      const [m, s] = await Promise.all([fetchMonthly(token), fetchSurvey(token)]);
      if (!s) { router.replace("/onboarding"); return; }
      setSurvey(s);
      setData(m ?? {
        transport_kg: Math.round(s.transport_kg / 12),
        energy_kg: Math.round(s.energy_kg / 12),
        food_kg: Math.round(s.food_kg / 12),
        shopping_kg: Math.round(s.shopping_kg / 12),
        total_kg: Math.round(s.baseline_kg / 12),
      });
    });
  }, [isLoaded, isSignedIn]);

  if (!data || !survey) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;

  const CARDS = [
    { icon: "🚗", label: "Transport", kg: data.transport_kg, colorClass: "" },
    { icon: "⚡", label: "Energy",    kg: data.energy_kg,    colorClass: "" },
    { icon: "🍽️", label: "Food",      kg: data.food_kg,      colorClass: "" },
    { icon: "🛍️", label: "Shopping",  kg: data.shopping_kg,  colorClass: "" },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      <div><h1 className="text-3xl font-bold text-gray-900">Your Carbon Dashboard</h1><p className="text-gray-500 mt-1">This month's emissions overview</p></div>
      <div className="bg-brand-600 text-white rounded-2xl p-6 flex items-center justify-between">
        <div>
          <p className="text-brand-100 text-sm">Monthly total</p>
          <p className="text-4xl font-bold mt-1">{data.total_kg.toLocaleString()} <span className="text-xl font-normal">kg CO₂</span></p>
        </div>
        <div className="text-right">
          <p className="text-brand-100 text-sm">Annual baseline</p>
          <p className="text-2xl font-bold">{(survey.baseline_kg / 1000).toFixed(1)} <span className="text-base font-normal">tons</span></p>
          <p className="text-brand-200 text-sm mt-1">Better than 63% of users 🎉</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">{CARDS.map(c => <CategoryCard key={c.label} {...c} sparkData={SPARK} />)}</div>
      <NormChart userKg={data.total_kg} />
    </div>
  );
}
