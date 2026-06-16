"""
Carbon emission factor math using DEFRA 2023 / EPA eGRID constants.
All outputs in kg CO2e per year. Phase 2 will replace constants with Climatiq API.
"""
from dataclasses import dataclass
from typing import Literal, TypedDict

# ── Emission factors (kg CO2e per unit) ──────────────────────────────────────
EF: dict[str, float] = {
    # Transport (per km)
    "car_petrol": 0.170,
    "car_diesel": 0.163,
    "car_hybrid": 0.106,
    "car_ev": 0.053,
    "bus": 0.089,
    "train": 0.041,
    "flight_short": 0.133,   # economy, per passenger-km
    "flight_long": 0.195,
    # Energy (per kWh)
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

# Average km driven per year by vehicle type
AVG_KM_PER_YEAR: dict[str, int] = {
    "ice": 14_500,
    "hybrid": 14_500,
    "ev": 14_500,
    "none": 0,
}

# Round-trip km by flight type
FLIGHT_KM: dict[str, int] = {
    "short": 1_500,
    "long": 8_000,
}


class HomeInput(TypedDict, total=False):
    house_size_m2: float
    occupants: int
    heating_type: Literal["electric", "oil", "gas"]


class LifestyleInput(TypedDict, total=False):
    diet: Literal["vegan", "vegetarian", "pescatarian", "omnivore", "meat_heavy"]
    flights_per_year: int
    flight_type: Literal["short", "long"]
    transport_mode: Literal["car", "bus", "train", "bicycle"]


class VehicleInput(TypedDict, total=False):
    type: Literal["ice", "hybrid", "ev", "none"]


@dataclass
class CarbonBreakdown:
    """Annual carbon footprint broken down by category (kg CO2e)."""

    transport_kg: float
    energy_kg: float
    food_kg: float
    shopping_kg: float

    @property
    def total_kg(self) -> float:
        """Sum of all category emissions."""
        return self.transport_kg + self.energy_kg + self.food_kg + self.shopping_kg


def calculate_baseline(
    home: HomeInput,
    lifestyle: LifestyleInput,
    vehicle: VehicleInput,
) -> CarbonBreakdown:
    """
    Derive annual kg CO2e from onboarding survey data.

    Args:
        home: house_size_m2, occupants, heating_type
        lifestyle: diet, flights_per_year, flight_type, transport_mode
        vehicle: type — "ice" | "hybrid" | "ev" | "none"

    Returns:
        CarbonBreakdown with transport, energy, food, shopping, and total fields.
    """
    transport_kg = _calculate_transport(lifestyle, vehicle)
    energy_kg = _calculate_energy(home)
    food_kg = _calculate_food(lifestyle)
    shopping_kg = 800.0  # UK average for clothing / electronics / goods

    return CarbonBreakdown(
        transport_kg=round(transport_kg, 1),
        energy_kg=round(energy_kg, 1),
        food_kg=round(food_kg, 1),
        shopping_kg=round(shopping_kg, 1),
    )


def _calculate_transport(lifestyle: LifestyleInput, vehicle: VehicleInput) -> float:
    """Return annual transport kg CO2e from car, flights, and public transit."""
    vtype = str(vehicle.get("type", "none")).lower()
    ef_car = {
        "ice": EF["car_petrol"],
        "hybrid": EF["car_hybrid"],
        "ev": EF["car_ev"],
        "none": 0.0,
    }.get(vtype, EF["car_petrol"])

    car_kg = AVG_KM_PER_YEAR.get(vtype, 0) * ef_car

    flights = int(lifestyle.get("flights_per_year", 0))
    ftype = str(lifestyle.get("flight_type", "short"))
    flight_kg = flights * FLIGHT_KM.get(ftype, 1_500) * EF.get(f"flight_{ftype}", EF["flight_short"])

    transport_mode = str(lifestyle.get("transport_mode", "car"))
    transit_kg = 0.0
    if transport_mode == "bus":
        transit_kg = 250 * 2 * EF["bus"]       # ~250 work days × 2 km avg
    elif transport_mode == "train":
        transit_kg = 250 * 10 * EF["train"]

    return car_kg + flight_kg + transit_kg


def _calculate_energy(home: HomeInput) -> float:
    """Return annual energy kg CO2e based on house size, occupants, and heating type."""
    house_m2 = float(home.get("house_size_m2", 80))
    occupants = max(1, int(home.get("occupants", 2)))
    heating = str(home.get("heating_type", "gas")).lower()

    kwh_per_m2 = 130.0  # UK average electricity + heat combined
    per_person_kwh = (house_m2 * kwh_per_m2) / occupants

    if heating == "electric":
        return per_person_kwh * EF["electricity_uk"]
    if heating == "oil":
        return (per_person_kwh * 0.4 * EF["electricity_uk"]
                + per_person_kwh * 0.6 * EF["oil_heating"])
    # gas (default)
    return (per_person_kwh * 0.4 * EF["electricity_uk"]
            + per_person_kwh * 0.6 * EF["natural_gas"])


def _calculate_food(lifestyle: LifestyleInput) -> float:
    """Return annual food kg CO2e based on diet type."""
    diet = str(lifestyle.get("diet", "omnivore")).lower()
    weekly_kg = {
        "vegan": EF["vegan"] * 7,
        "vegetarian": EF["dairy"] * 3 + EF["vegetables"] * 4,
        "pescatarian": EF["fish"] * 2 + EF["dairy"] * 2 + EF["vegetables"] * 3,
        "omnivore": (EF["beef"] * 0.5 + EF["chicken"] * 1
                     + EF["pork"] * 0.5 + EF["dairy"] * 2 + EF["vegetables"] * 3),
        "meat_heavy": (EF["beef"] * 1.5 + EF["lamb"] * 0.5
                       + EF["pork"] * 1 + EF["chicken"] * 1 + EF["dairy"] * 2),
    }.get(diet, 15.0)

    return weekly_kg * 52
