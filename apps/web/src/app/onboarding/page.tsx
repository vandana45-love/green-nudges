"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { submitSurvey } from "@/lib/api";

type Step = 1 | 2 | 3;

interface HomeData { house_size_m2: number; occupants: number; heating_type: string }
interface LifestyleData { diet: string; flights_per_year: number; flight_type: string; transport_mode: string }
interface VehicleData { type: string }

const STEPS = ["Home", "Lifestyle", "Vehicle"];

export default function OnboardingPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [home, setHome] = useState<HomeData>({ house_size_m2: 80, occupants: 2, heating_type: "gas" });
  const [lifestyle, setLifestyle] = useState<LifestyleData>({ diet: "omnivore", flights_per_year: 2, flight_type: "short", transport_mode: "car" });
  const [vehicle, setVehicle] = useState<VehicleData>({ type: "ice" });

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await submitSurvey(token, { home, lifestyle, vehicle });
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

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
        {step === 3 && <StepVehicle data={vehicle} onChange={setVehicle} onBack={() => setStep(2)} onSubmit={handleSubmit} loading={loading} />}
      </div>
    </div>
  );
}

function StepHome({ data, onChange, onNext }: { data: HomeData; onChange: (d: HomeData) => void; onNext: () => void }) {
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-900">Your Home</h2>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">House size (m²)</span>
        <input type="number" value={data.house_size_m2} onChange={e => onChange({ ...data, house_size_m2: +e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Number of occupants</span>
        <input type="number" min={1} value={data.occupants} onChange={e => onChange({ ...data, occupants: +e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Heating type</span>
        <select value={data.heating_type} onChange={e => onChange({ ...data, heating_type: e.target.value })}
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

function StepLifestyle({ data, onChange, onBack, onNext }: { data: LifestyleData; onChange: (d: LifestyleData) => void; onBack: () => void; onNext: () => void }) {
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
        <input type="number" min={0} value={data.flights_per_year} onChange={e => onChange({ ...data, flights_per_year: +e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Typical flight length</span>
        <select value={data.flight_type} onChange={e => onChange({ ...data, flight_type: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="short">Short-haul (&lt; 3h)</option>
          <option value="long">Long-haul (&gt; 3h)</option>
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-gray-700">Primary transport mode</span>
        <select value={data.transport_mode} onChange={e => onChange({ ...data, transport_mode: e.target.value })}
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

function StepVehicle({ data, onChange, onBack, onSubmit, loading }: { data: VehicleData; onChange: (d: VehicleData) => void; onBack: () => void; onSubmit: () => void; loading: boolean }) {
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
          <button key={opt.value} onClick={() => onChange({ type: opt.value })}
            className={`p-4 rounded-xl border-2 text-left transition ${data.type === opt.value ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-brand-300"}`}>
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
