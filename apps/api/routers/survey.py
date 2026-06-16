from typing import Literal, cast

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from middleware.firebase_auth import get_current_user
from models import Survey, User
from services.carbon_engine import (
    HomeInput,
    LifestyleInput,
    VehicleInput,
    calculate_baseline,
)

router = APIRouter(prefix="/survey", tags=["survey"])


class HomeData(BaseModel):
    house_size_m2: float = Field(gt=0, le=1000, description="House floor area in m²")
    occupants: int = Field(ge=1, le=20, description="Number of people sharing the home")
    heating_type: Literal["electric", "oil", "gas"] = "gas"


class LifestyleData(BaseModel):
    diet: Literal["vegan", "vegetarian", "pescatarian", "omnivore", "meat_heavy"] = (
        "omnivore"
    )
    flights_per_year: int = Field(ge=0, le=365, description="Return flights per year")
    flight_type: Literal["short", "long"] = "short"
    transport_mode: Literal["car", "bus", "train", "bicycle"] = "car"


class VehicleData(BaseModel):
    type: Literal["ice", "hybrid", "ev", "none"] = "ice"


class SurveyIn(BaseModel):
    home: HomeData
    lifestyle: LifestyleData
    vehicle: VehicleData


class SurveyOut(BaseModel):
    baseline_kg: float
    transport_kg: float
    energy_kg: float
    food_kg: float
    shopping_kg: float


async def _get_or_create_user(user_uid: str, db: AsyncSession) -> User:
    """Return existing User row or create one for the given Firebase UID."""
    user = await db.scalar(select(User).where(User.clerk_id == user_uid))
    if not user:
        user = User(clerk_id=user_uid, email="")
        db.add(user)
        await db.flush()
    return user


@router.post("", response_model=SurveyOut)
async def submit_survey(
    body: SurveyIn,
    user_uid: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SurveyOut:
    """Submit the onboarding survey and return the calculated carbon baseline."""
    user = await _get_or_create_user(user_uid, db)
    bd = calculate_baseline(
        cast(HomeInput, body.home.model_dump()),
        cast(LifestyleInput, body.lifestyle.model_dump()),
        cast(VehicleInput, body.vehicle.model_dump()),
    )

    survey = Survey(
        user_id=user.id,
        home_data=body.home.model_dump(),
        lifestyle_data=body.lifestyle.model_dump(),
        vehicle_data=body.vehicle.model_dump(),
        baseline_kg=bd.total_kg,
        transport_kg=bd.transport_kg,
        energy_kg=bd.energy_kg,
        food_kg=bd.food_kg,
        shopping_kg=bd.shopping_kg,
    )
    db.add(survey)
    await db.commit()

    return SurveyOut(
        baseline_kg=bd.total_kg,
        transport_kg=bd.transport_kg,
        energy_kg=bd.energy_kg,
        food_kg=bd.food_kg,
        shopping_kg=bd.shopping_kg,
    )


@router.get("/me", response_model=SurveyOut)
async def get_my_survey(
    user_uid: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SurveyOut:
    """Return the most recent survey for the authenticated user."""
    user = await db.scalar(select(User).where(User.clerk_id == user_uid))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    survey = await db.scalar(
        select(Survey)
        .where(Survey.user_id == user.id)
        .order_by(Survey.created_at.desc())
    )
    if not survey:
        raise HTTPException(
            status_code=404, detail="No survey found — complete onboarding first"
        )
    return SurveyOut(
        baseline_kg=survey.baseline_kg,
        transport_kg=survey.transport_kg,
        energy_kg=survey.energy_kg,
        food_kg=survey.food_kg,
        shopping_kg=survey.shopping_kg,
    )
