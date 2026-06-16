import { calculateCarbon, SurveyInput } from "../carbon";

const BASE: SurveyInput = {
  houseSizeM2: 80,
  occupants: 2,
  heatingType: "gas",
  diet: "omnivore",
  flightsPerYear: 2,
  flightType: "short",
  transportMode: "car",
  vehicleType: "ice",
};

describe("calculateCarbon", () => {
  describe("output shape", () => {
    it("returns all five breakdown fields", () => {
      const result = calculateCarbon(BASE);
      expect(result).toHaveProperty("energyKg");
      expect(result).toHaveProperty("transportKg");
      expect(result).toHaveProperty("foodKg");
      expect(result).toHaveProperty("shoppingKg");
      expect(result).toHaveProperty("baselineKg");
    });

    it("returns positive numbers for all fields", () => {
      const result = calculateCarbon(BASE);
      expect(result.energyKg).toBeGreaterThan(0);
      expect(result.transportKg).toBeGreaterThan(0);
      expect(result.foodKg).toBeGreaterThan(0);
      expect(result.shoppingKg).toBeGreaterThan(0);
      expect(result.baselineKg).toBeGreaterThan(0);
    });

    it("baselineKg equals the sum of all category emissions (within rounding)", () => {
      const r = calculateCarbon(BASE);
      const sum = r.energyKg + r.transportKg + r.foodKg + r.shoppingKg;
      expect(Math.abs(r.baselineKg - sum)).toBeLessThanOrEqual(4);
    });

    it("all values are rounded integers", () => {
      const r = calculateCarbon(BASE);
      expect(r.energyKg % 1).toBe(0);
      expect(r.transportKg % 1).toBe(0);
      expect(r.foodKg % 1).toBe(0);
      expect(r.shoppingKg % 1).toBe(0);
      expect(r.baselineKg % 1).toBe(0);
    });
  });

  describe("diet emissions", () => {
    const diets = ["vegan", "vegetarian", "pescatarian", "omnivore", "meat_heavy"] as const;

    it("vegan produces the least food emissions", () => {
      const results = diets.map((diet) => calculateCarbon({ ...BASE, diet }).foodKg);
      const veganKg = results[0];
      results.slice(1).forEach((kg) => expect(veganKg).toBeLessThan(kg));
    });

    it("meat_heavy produces the most food emissions", () => {
      const results = diets.map((diet) => calculateCarbon({ ...BASE, diet }).foodKg);
      const meatHeavyKg = results[results.length - 1];
      results.slice(0, -1).forEach((kg) => expect(meatHeavyKg).toBeGreaterThan(kg));
    });

    it("vegan food kg equals 1300", () => {
      expect(calculateCarbon({ ...BASE, diet: "vegan" }).foodKg).toBe(1300);
    });

    it("meat_heavy food kg equals 3300", () => {
      expect(calculateCarbon({ ...BASE, diet: "meat_heavy" }).foodKg).toBe(3300);
    });
  });

  describe("transport emissions", () => {
    it("EV produces fewer transport emissions than ICE", () => {
      const ev = calculateCarbon({ ...BASE, vehicleType: "ev" });
      const ice = calculateCarbon({ ...BASE, vehicleType: "ice" });
      expect(ev.transportKg).toBeLessThan(ice.transportKg);
    });

    it("hybrid produces fewer emissions than ICE but more than EV", () => {
      const ev = calculateCarbon({ ...BASE, vehicleType: "ev" }).transportKg;
      const hybrid = calculateCarbon({ ...BASE, vehicleType: "hybrid" }).transportKg;
      const ice = calculateCarbon({ ...BASE, vehicleType: "ice" }).transportKg;
      expect(hybrid).toBeGreaterThan(ev);
      expect(hybrid).toBeLessThan(ice);
    });

    it("train produces less transport emissions than car", () => {
      const train = calculateCarbon({ ...BASE, transportMode: "train" });
      const car = calculateCarbon({ ...BASE, transportMode: "car" });
      expect(train.transportKg).toBeLessThan(car.transportKg);
    });

    it("zero flights reduces transport emissions", () => {
      const noFlights = calculateCarbon({ ...BASE, flightsPerYear: 0 });
      const withFlights = calculateCarbon({ ...BASE, flightsPerYear: 5 });
      expect(noFlights.transportKg).toBeLessThan(withFlights.transportKg);
    });

    it("long-haul flights produce more emissions than short-haul", () => {
      const shortHaul = calculateCarbon({ ...BASE, flightsPerYear: 1, flightType: "short" });
      const longHaul = calculateCarbon({ ...BASE, flightsPerYear: 1, flightType: "long" });
      expect(longHaul.transportKg).toBeGreaterThan(shortHaul.transportKg);
    });

    it("bus produces less transport emissions than car", () => {
      const bus = calculateCarbon({ ...BASE, transportMode: "bus" });
      const car = calculateCarbon({ ...BASE, transportMode: "car" });
      expect(bus.transportKg).toBeLessThan(car.transportKg);
    });

    it("bicycle transport with no flights = 0 transport emissions", () => {
      const result = calculateCarbon({ ...BASE, transportMode: "bicycle", vehicleType: "none", flightsPerYear: 0 });
      expect(result.transportKg).toBe(0);
    });
  });

  describe("energy emissions", () => {
    it("electric heating produces fewer emissions than gas", () => {
      const electric = calculateCarbon({ ...BASE, heatingType: "electric" });
      const gas = calculateCarbon({ ...BASE, heatingType: "gas" });
      expect(electric.energyKg).toBeLessThan(gas.energyKg);
    });

    it("more occupants reduces per-person energy emissions", () => {
      const single = calculateCarbon({ ...BASE, occupants: 1 });
      const family = calculateCarbon({ ...BASE, occupants: 4 });
      expect(single.energyKg).toBeGreaterThan(family.energyKg);
    });

    it("larger home produces more energy emissions", () => {
      const small = calculateCarbon({ ...BASE, houseSizeM2: 40 });
      const large = calculateCarbon({ ...BASE, houseSizeM2: 200 });
      expect(large.energyKg).toBeGreaterThan(small.energyKg);
    });
  });

  describe("shopping emissions", () => {
    it("shopping is fixed at 1000 kg per year", () => {
      expect(calculateCarbon(BASE).shoppingKg).toBe(1000);
    });
  });
});
