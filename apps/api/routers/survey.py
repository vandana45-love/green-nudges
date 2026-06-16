from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db import get_db
from models import User, Survey
from services.carbon_engine import calculate_baseline
from middleware.clerk_auth import get_current_user_id

router = APIRouter(prefix="/survey", tags=["survey"])


class SurveyIn(BaseModel):
    home: dict
    lifestyle: dict
    vehicle: dict


class SurveyOut(BaseModel):
    baseline_kg: float
    transport_kg: float
    energy_kg: float
    food_kg: float
    shopping_kg: float


async def _get_or_create_user(clerk_id: str, db: AsyncSession) -> User:
    user = await db.scalar(select(User).where(User.clerk_id == clerk_id))
    if not user:
        user = User(clerk_id=clerk_id, email="")
        db.add(user)
        await db.flush()
    return user


@router.post("", response_model=SurveyOut)
async def submit_survey(
    body: SurveyIn,
    clerk_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await _get_or_create_user(clerk_id, db)
    bd = calculate_baseline(body.home, body.lifestyle, body.vehicle)

    survey = Survey(
        user_id=user.id,
        home_data=body.home,
        lifestyle_data=body.lifestyle,
        vehicle_data=body.vehicle,
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
    clerk_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    user = await db.scalar(select(User).where(User.clerk_id == clerk_id))
    if not user:
        raise HTTPException(404, "User not found")
    survey = await db.scalar(
        select(Survey).where(Survey.user_id == user.id).order_by(Survey.created_at.desc())
    )
    if not survey:
        raise HTTPException(404, "Survey not found")
    return SurveyOut(
        baseline_kg=survey.baseline_kg,
        transport_kg=survey.transport_kg,
        energy_kg=survey.energy_kg,
        food_kg=survey.food_kg,
        shopping_kg=survey.shopping_kg,
    )
