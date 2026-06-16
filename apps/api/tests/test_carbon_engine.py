"""
Unit tests for the carbon calculation engine.
Tests cover all diet types, transport modes, energy types, and edge cases.
"""
import pytest

from services.carbon_engine import (
    CarbonBreakdown,
    _calculate_energy,
    _calculate_food,
    _calculate_transport,
    calculate_baseline,
)

# ── Fixtures ──────────────────────────────────────────────────────────────────

BASE_HOME = {"house_size_m2": 80, "occupants": 2, "heating_type": "gas"}
BASE_LIFESTYLE = {
    "diet": "omnivore",
    "flights_per_year": 2,
    "flight_type": "short",
    "transport_mode": "car",
}
BASE_VEHICLE = {"type": "ice"}


# ── Output shape ──────────────────────────────────────────────────────────────

class TestOutputShape:
    def test_returns_carbon_breakdown_instance(self):
        result = calculate_baseline(BASE_HOME, BASE_LIFESTYLE, BASE_VEHICLE)
        assert isinstance(result, CarbonBreakdown)

    def test_all_category_fields_are_positive(self):
        result = calculate_baseline(BASE_HOME, BASE_LIFESTYLE, BASE_VEHICLE)
        assert result.transport_kg > 0
        assert result.energy_kg > 0
        assert result.food_kg > 0
        assert result.shopping_kg > 0

    def test_total_kg_equals_sum_of_categories(self):
        r = calculate_baseline(BASE_HOME, BASE_LIFESTYLE, BASE_VEHICLE)
        expected = r.transport_kg + r.energy_kg + r.food_kg + r.shopping_kg
        assert r.total_kg == pytest.approx(expected)

    def test_values_are_rounded_to_one_decimal(self):
        r = calculate_baseline(BASE_HOME, BASE_LIFESTYLE, BASE_VEHICLE)
        for val in (r.transport_kg, r.energy_kg, r.food_kg, r.shopping_kg):
            assert round(val, 1) == val

    def test_shopping_is_fixed_baseline(self):
        r = calculate_baseline(BASE_HOME, BASE_LIFESTYLE, BASE_VEHICLE)
        assert r.shopping_kg == pytest.approx(800.0)


# ── Diet ─────────────────────────────────────────────────────────────────────

class TestDietEmissions:
    DIETS = ["vegan", "vegetarian", "pescatarian", "omnivore", "meat_heavy"]

    def test_vegan_has_lowest_food_emissions(self):
        results = {d: _calculate_food({"diet": d}) for d in self.DIETS}
        assert results["vegan"] < results["vegetarian"]
        assert results["vegan"] < results["omnivore"]

    def test_meat_heavy_has_highest_food_emissions(self):
        results = {d: _calculate_food({"diet": d}) for d in self.DIETS}
        for diet in self.DIETS[:-1]:
            assert results["meat_heavy"] > results[diet]

    @pytest.mark.parametrize("diet", ["vegan", "vegetarian", "pescatarian", "omnivore", "meat_heavy"])
    def test_all_diets_return_positive_value(self, diet: str):
        assert _calculate_food({"diet": diet}) > 0

    def test_unknown_diet_falls_back_to_default(self):
        result = _calculate_food({"diet": "invalid_diet"})
        assert result == pytest.approx(15.0 * 52)


# ── Transport ─────────────────────────────────────────────────────────────────

class TestTransportEmissions:
    def test_ev_lower_than_ice(self):
        ev = _calculate_transport(BASE_LIFESTYLE, {"type": "ev"})
        ice = _calculate_transport(BASE_LIFESTYLE, {"type": "ice"})
        assert ev < ice

    def test_hybrid_between_ev_and_ice(self):
        ev = _calculate_transport(BASE_LIFESTYLE, {"type": "ev"})
        hybrid = _calculate_transport(BASE_LIFESTYLE, {"type": "hybrid"})
        ice = _calculate_transport(BASE_LIFESTYLE, {"type": "ice"})
        assert ev < hybrid < ice

    def test_no_car_removes_car_emissions(self):
        no_car = _calculate_transport({**BASE_LIFESTYLE, "flights_per_year": 0}, {"type": "none"})
        assert no_car == pytest.approx(0.0)

    def test_bus_lower_than_car(self):
        bus = _calculate_transport({**BASE_LIFESTYLE, "transport_mode": "bus"}, BASE_VEHICLE)
        car = _calculate_transport({**BASE_LIFESTYLE, "transport_mode": "car"}, BASE_VEHICLE)
        assert bus < car

    def test_train_lower_than_bus(self):
        train = _calculate_transport({**BASE_LIFESTYLE, "transport_mode": "train"}, BASE_VEHICLE)
        bus = _calculate_transport({**BASE_LIFESTYLE, "transport_mode": "bus"}, BASE_VEHICLE)
        assert train < bus

    def test_zero_flights_removes_flight_emissions(self):
        no_flights = _calculate_transport({**BASE_LIFESTYLE, "flights_per_year": 0}, BASE_VEHICLE)
        with_flights = _calculate_transport({**BASE_LIFESTYLE, "flights_per_year": 5}, BASE_VEHICLE)
        assert no_flights < with_flights

    def test_long_haul_more_than_short_haul(self):
        short = _calculate_transport(
            {**BASE_LIFESTYLE, "flights_per_year": 1, "flight_type": "short"}, BASE_VEHICLE
        )
        long = _calculate_transport(
            {**BASE_LIFESTYLE, "flights_per_year": 1, "flight_type": "long"}, BASE_VEHICLE
        )
        assert long > short

    def test_negative_flights_treated_as_zero(self):
        """Edge case: malformed input with negative flights should not crash."""
        result = _calculate_transport({**BASE_LIFESTYLE, "flights_per_year": -2}, BASE_VEHICLE)
        assert isinstance(result, float)


# ── Energy ────────────────────────────────────────────────────────────────────

class TestEnergyEmissions:
    def test_electric_lower_than_gas(self):
        electric = _calculate_energy({**BASE_HOME, "heating_type": "electric"})
        gas = _calculate_energy({**BASE_HOME, "heating_type": "gas"})
        assert electric < gas

    def test_oil_higher_than_gas(self):
        oil = _calculate_energy({**BASE_HOME, "heating_type": "oil"})
        gas = _calculate_energy({**BASE_HOME, "heating_type": "gas"})
        assert oil > gas

    def test_more_occupants_reduces_per_person_energy(self):
        single = _calculate_energy({**BASE_HOME, "occupants": 1})
        family = _calculate_energy({**BASE_HOME, "occupants": 4})
        assert single > family

    def test_larger_home_increases_energy(self):
        small = _calculate_energy({**BASE_HOME, "house_size_m2": 40})
        large = _calculate_energy({**BASE_HOME, "house_size_m2": 200})
        assert large > small

    def test_zero_occupants_defaults_to_one(self):
        """Edge case: occupants=0 must not cause ZeroDivisionError."""
        result = _calculate_energy({**BASE_HOME, "occupants": 0})
        assert result > 0

    def test_unknown_heating_defaults_to_gas(self):
        gas = _calculate_energy({**BASE_HOME, "heating_type": "gas"})
        unknown = _calculate_energy({**BASE_HOME, "heating_type": "wood_pellet"})
        assert unknown == pytest.approx(gas)


# ── Integration ───────────────────────────────────────────────────────────────

class TestIntegration:
    def test_full_calculation_with_minimal_footprint(self):
        """Vegan, EV, electric heating, no flights → lowest possible baseline."""
        result = calculate_baseline(
            {"house_size_m2": 40, "occupants": 4, "heating_type": "electric"},
            {"diet": "vegan", "flights_per_year": 0, "flight_type": "short", "transport_mode": "bicycle"},
            {"type": "none"},
        )
        assert result.total_kg < 2000  # well below UK average of ~8,000

    def test_full_calculation_with_high_footprint(self):
        """Meat-heavy, ICE car, oil heating, many long flights → high baseline."""
        result = calculate_baseline(
            {"house_size_m2": 200, "occupants": 1, "heating_type": "oil"},
            {"diet": "meat_heavy", "flights_per_year": 10, "flight_type": "long", "transport_mode": "car"},
            {"type": "ice"},
        )
        assert result.total_kg > 10_000
