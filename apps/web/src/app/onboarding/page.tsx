"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { saveSurvey, saveRecommendations } from "@/lib/firestore";
import { generateRecommendations } from "@/lib/gemini";
import type { SurveyInput } from "@/lib/carbon";

type Step = 1 | 2 | 3;
const STEPS = ["Home", "Lifestyle", "Vehicle"];

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [home, setHome] = useState({ houseSizeM2: 80, occupants: 2, heatingType: "gas" });
  const [lifestyle, setLifestyle] = useState({ diet: "omnivore", flightsPerYear: 2, flightType: "short", transportMode: "car" });
  const [vehicle, setVehicle] = useState({ vehicleType: "ice" });

  useEffect(() => {
    if (!loading && !user) router.replace("/sign-in");
  }, [user, loading, router]);

  async function handleSubmit() {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      const input: SurveyInput = { ...home, ...lifestyle, ...vehicle };
      const survey = await saveSurvey(user.uid, input);
      const recs = await generateRecommendations(survey);
      await saveRecommendations(user.uid, recs);
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-8 space-y-6">
        <div className="flex gap-2 mb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 text-center">
              <div className={`h-2 rounded-full ${i + 1 <= step ? "bg-brand-500" : "bg-gray-200"}`} />
              <p className={`text-xs mt-1 ${i + 1 === step ? "text-brand-700 font-semibold" : "text-gray-400"}`}>{s}</p>
            </div>
          ))}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {step === 1 && <StepHome data={home} onChange={setHome} onNext={() => setStep(2)} />}
        {step === 2 && <StepLifestyle data={lifestyle} onChange={setLifestyle} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
        {step === 3 && <StepVehicle data={vehicle} onChange={setVehicle} onBack={() => setStep(2)} onSubmit={handleSubmit} loading={saving} />}
      </div>
    </div>
  );
}

function StepHome({ data, onChange, onNext }: any) {
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900">Your Home</h2>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">House size (m²)</span>
        <input type="number" value={data.houseSizeM2} onChange={e => onChange({ ...data, houseSizeM2: +e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Number of occupants</span>
        <input type="number" min={1} value={data.occupants} onChange={e => onChange({ ...data, occupants: +e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Heating type</span>
        <select value={data.heatingType} onChange={e => onChange({ ...data, heatingType: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="gas">Natural Gas</option>
          <option value="electric">Electric / Heat Pump</option>
          <option value="oil">Oil</option>
        </select>
      </label>
      <button onClick={onNext} className="w-full bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition">Next →</button>
    </div>
  );
}

function StepLifestyle({ data, onChange, onBack, onNext }: any) {
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900">Your Lifestyle</h2>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Diet</span>
        <select value={data.diet} onChange={e => onChange({ ...data, diet: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="vegan">Vegan</option>
          <option value="vegetarian">Vegetarian</option>
          <option value="pescatarian">Pescatarian</option>
          <option value="omnivore">Omnivore</option>
          <option value="meat_heavy">Meat Heavy</option>
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Flights per year</span>
        <input type="number" min={0} value={data.flightsPerYear} onChange={e => onChange({ ...data, flightsPerYear: +e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Typical flight length</span>
        <select value={data.flightType} onChange={e => onChange({ ...data, flightType: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="short">Short-haul (&lt; 3h)</option>
          <option value="long">Long-haul (&gt; 3h)</option>
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Primary transport</span>
        <select value={data.transportMode} onChange={e => onChange({ ...data, transportMode: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="car">Car</option>
          <option value="bus">Bus</option>
          <option value="train">Train</option>
          <option value="bicycle">Bicycle / Walk</option>
        </select>
      </label>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">← Back</button>
        <button onClick={onNext} className="flex-1 bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition">Next →</button>
      </div>
    </div>
  );
}

function StepVehicle({ data, onChange, onBack, onSubmit, loading }: any) {
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900">Your Vehicle</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { value: "ice", label: "⛽ Petrol / Diesel" },
          { value: "hybrid", label: "🔋 Hybrid" },
          { value: "ev", label: "⚡ Electric" },
          { value: "none", label: "🚶 No Car" },
        ].map(opt => (
          <button key={opt.value} onClick={() => onChange({ vehicleType: opt.value })}
            className={`p-4 rounded-xl border-2 text-left transition ${data.vehicleType === opt.value ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-brand-300"}`}>
            {opt.label}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition">← Back</button>
        <button onClick={onSubmit} disabled={loading}
          className="flex-1 bg-brand-600 text-white font-semibold py-3 rounded-xl hover:bg-brand-700 transition disabled:opacity-60">
          {loading ? "Calculating…" : "See My Footprint 🌿"}
        </button>
      </div>
    </div>
  );
}
