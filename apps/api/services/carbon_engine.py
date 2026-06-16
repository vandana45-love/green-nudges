"""
Carbon emission factor math using DEFRA 2023 / EPA eGRID constants.
All outputs in kg CO2e. Phase 2 will replace constants with Climatiq API calls.
"""
from dataclasses import dataclass

# ── Emission factors ─────────────────────────────────────────────────────────
EF = {
    # Transport (kg CO2e per km)
    "car_petrol": 0.170,
    "car_diesel": 0.163,
    "car_hybrid": 0.106,
    "car_ev": 0.053,
    "bus": 0.089,
    "train": 0.041,
    "flight_short": 0.133,   # economy, per passenger-km
    "flight_long": 0.195,
    # Energy (kg CO2e per kWh)
    "electricity_uk": 0.207,
    "natural_gas": 0.183,
    "oil_heating": 0.245,
    # Food (kg CO2e per kg food consumed per week → annualised)
    "beef": 27.0,
    "lamb": 25.6,
    "pork": 7.6,
    "chicken": 6.9,
    "fish": 5.1,
    "dairy": 3.2,
    "vegetables": 2.0,
    "vegan": 1.5,
}

# Average km driven per year by vehicle type (baseline assumption)
AVG_KM_PER_YEAR = {
    "ice": 14_500,
    "hybrid": 14_500,
    "ev": 14_500,
    "none": 0,
}

# Average flight km per round trip type
FLIGHT_KM = {
    "short": 1_500,
    "long": 8_000,
}


@dataclass
class CarbonBreakdown:
    transport_kg: float
    energy_kg: float
    food_kg: float
    shopping_kg: float

    @property
    def total_kg(self) -> float:
        return self.transport_kg + self.energy_kg + self.food_kg + self.shopping_kg


def calculate_baseline(home: dict, lifestyle: dict, vehicle: dict) -> CarbonBreakdown:
    """
    Derive annual kg CO2e from onboarding survey data.

    home: {house_size_m2, occupants, heating_type}
    lifestyle: {diet, flights_per_year, flight_type, transport_mode}
    vehicle: {type}  # "ice" | "hybrid" | "ev" | "none"
    """
    # ── Transport ────────────────────────────────────────────────────────────
    vtype = vehicle.get("type", "none").lower()
    ef_car = {
        "ice": EF["car_petrol"],
        "hybrid": EF["car_hybrid"],
        "ev": EF["car_ev"],
        "none": 0.0,
    }.get(vtype, EF["car_petrol"])

    car_km = AVG_KM_PER_YEAR.get(vtype, 0)
    car_kg = car_km * ef_car

    flights = int(lifestyle.get("flights_per_year", 0))
    ftype = lifestyle.get("flight_type", "short")
    flight_kg = flights * FLIGHT_KM.get(ftype, 1500) * EF.get(f"flight_{ftype}", EF["flight_short"])

    transport_mode = lifestyle.get("transport_mode", "car")
    transit_kg = 0.0
    if transport_mode == "bus":
        transit_kg = 250 * 2 * EF["bus"]      # ~250 work days, 2km avg
    elif transport_mode == "train":
        transit_kg = 250 * 10 * EF["train"]

    transport_kg = car_kg + flight_kg + transit_kg

    # ── Energy ───────────────────────────────────────────────────────────────
    house_m2 = float(home.get("house_size_m2", 80))
    occupants = max(1, int(home.get("occupants", 2)))
    heating = home.get("heating_type", "gas").lower()

    kwh_per_m2 = 130.0  # UK avg electricity + heat combined
    total_kwh = house_m2 * kwh_per_m2
    per_person_kwh = total_kwh / occupants

    if heating == "electric":
        energy_kg = per_person_kwh * EF["electricity_uk"]
    elif heating == "oil":
        elec_kwh = per_person_kwh * 0.4
        heat_kwh = per_person_kwh * 0.6
        energy_kg = elec_kwh * EF["electricity_uk"] + heat_kwh * EF["oil_heating"]
    else:  # gas (default)
        elec_kwh = per_person_kwh * 0.4
        heat_kwh = per_person_kwh * 0.6
        energy_kg = elec_kwh * EF["electricity_uk"] + heat_kwh * EF["natural_gas"]

    # ── Food ─────────────────────────────────────────────────────────────────
    diet = lifestyle.get("diet", "omnivore").lower()
    food_ef_per_week = {
        "vegan": EF["vegan"] * 7,
        "vegetarian": (EF["dairy"] * 3 + EF["vegetables"] * 4),
        "pescatarian": (EF["fish"] * 2 + EF["dairy"] * 2 + EF["vegetables"] * 3),
        "omnivore": (EF["beef"] * 0.5 + EF["chicken"] * 1 + EF["pork"] * 0.5 + EF["dairy"] * 2 + EF["vegetables"] * 3),
        "meat_heavy": (EF["beef"] * 1.5 + EF["lamb"] * 0.5 + EF["pork"] * 1 + EF["chicken"] * 1 + EF["dairy"] * 2),
    }.get(diet, 15.0)

    food_kg = food_ef_per_week * 52

    # ── Shopping (flat estimate per diet / income proxy — Phase 2 uses Plaid) ─
    shopping_kg = 800.0  # UK avg for clothing/electronics/goods

    return CarbonBreakdown(
        transport_kg=round(transport_kg, 1),
        energy_kg=round(energy_kg, 1),
        food_kg=round(food_kg, 1),
        shopping_kg=round(shopping_kg, 1),
    )
