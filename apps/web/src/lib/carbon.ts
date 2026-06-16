export type HeatingType = "electric" | "oil" | "gas";
export type Diet = "vegan" | "vegetarian" | "pescatarian" | "omnivore" | "meat_heavy";
export type FlightType = "short" | "long";
export type TransportMode = "car" | "bus" | "train" | "bicycle";
export type VehicleType = "ice" | "hybrid" | "ev" | "none";

export interface SurveyInput {
  houseSizeM2: number;
  occupants: number;
  heatingType: HeatingType;
  diet: Diet;
  flightsPerYear: number;
  flightType: FlightType;
  transportMode: TransportMode;
  vehicleType: VehicleType;
}

export interface CarbonBreakdown {
  energyKg: number;
  transportKg: number;
  foodKg: number;
  shoppingKg: number;
  baselineKg: number;
}

const DIET_KG: Record<Diet, number> = {
  vegan: 1300,
  vegetarian: 1700,
  pescatarian: 1900,
  omnivore: 2100,
  meat_heavy: 3300,
};

export function calculateCarbon(s: SurveyInput): CarbonBreakdown {
  const kwhPerYear = (s.houseSizeM2 * 150) / Math.max(s.occupants, 1);
  const energyFactor = s.heatingType === "electric" ? 0.207 : s.heatingType === "oil" ? 2.52 : 2.204;
  const energyKg = kwhPerYear * energyFactor;

  const kmPerYear = 12000;
  let groundKg = 0;
  if (s.transportMode === "car") {
    const f = s.vehicleType === "ev" ? 0.07 : s.vehicleType === "hybrid" ? 0.10 : 0.17;
    groundKg = kmPerYear * f;
  } else if (s.transportMode === "bus") {
    groundKg = kmPerYear * 0.089;
  } else if (s.transportMode === "train") {
    groundKg = kmPerYear * 0.035;
  }

  const flightKm = s.flightType === "long" ? 8000 : 1500;
  const flightFactor = s.flightType === "long" ? 0.195 : 0.133;
  const flightKg = s.flightsPerYear * flightKm * 2 * flightFactor;

  const transportKg = groundKg + flightKg;
  const foodKg = DIET_KG[s.diet];
  const shoppingKg = 1000;
  const baselineKg = energyKg + transportKg + foodKg + shoppingKg;

  return {
    energyKg: Math.round(energyKg),
    transportKg: Math.round(transportKg),
    foodKg: Math.round(foodKg),
    shoppingKg: Math.round(shoppingKg),
    baselineKg: Math.round(baselineKg),
  };
}
