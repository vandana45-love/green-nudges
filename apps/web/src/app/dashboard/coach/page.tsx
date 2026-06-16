"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { fetchRecommendations } from "@/lib/api";

const META: Record<string, { icon: string; color: string }> = {
  transport: { icon: "🚗", color: "bg-blue-50 border-blue-100" },
  energy:    { icon: "⚡", color: "bg-yellow-50 border-yellow-100" },
  food:      { icon: "🍽️", color: "bg-orange-50 border-orange-100" },
  shopping:  { icon: "🛍️", color: "bg-purple-50 border-purple-100" },
  general:   { icon: "🌿", color: "bg-brand-50 border-brand-100" },
};

export default function CoachPage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const router = useRouter();
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.replace("/sign-in"); return; }
    getToken().then(async (token) => {
      if (!token) return;
      setRecs(await fetchRecommendations(token));
      setLoading(false);
    });
  }, [isLoaded, isSignedIn]);

  return (
    <div className="max-w-2xl space-y-8">
      <div><h1 className="text-3xl font-bold text-gray-900">AI Coach</h1><p className="text-gray-500 mt-1">Personalised recommendations updated daily</p></div>
      {loading ? <div className="text-gray-400 py-8 text-center">Loading…</div> :
       recs.length === 0 ? <div className="bg-white rounded-2xl border p-8 text-center text-gray-400"><p className="text-4xl mb-3">🌱</p><p>Complete your survey first.</p></div> :
       <div className="space-y-4">{recs.map((r: any) => { const m = META[r.category] ?? META.general; return (
         <div key={r.id} className={`rounded-2xl border p-5 space-y-2 ${m.color}`}>
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-2"><span className="text-xl">{m.icon}</span><span className="text-xs font-semibold uppercase text-gray-500">{r.category}</span></div>
             <span className="text-green-600 font-bold text-sm">-{r.savings_kg.toFixed(0)} kg CO₂</span>
           </div>
           <p className="text-gray-800">{r.message}</p>
         </div>
       );})}</div>}
    </div>
  );
}
