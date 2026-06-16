from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db import get_db
from models import User, DailyLog, Survey
from middleware.firebase_auth import get_current_user

router = APIRouter(prefix="/carbon", tags=["carbon"])


class LogIn(BaseModel):
    log_date: date
    transport_kg: float = Field(ge=0)
    energy_kg: float = Field(ge=0)
    food_kg: float = Field(ge=0)
    shopping_kg: float = Field(ge=0)


class LogOut(BaseModel):
    id: int
    log_date: date
    transport_kg: float
    energy_kg: float
    food_kg: float
    shopping_kg: float
    total_kg: float


class MonthlyOut(BaseModel):
    transport_kg: float
    energy_kg: float
    food_kg: float
    shopping_kg: float
    total_kg: float
    user_rank_percentile: float = 63.0


async def _require_user(user_uid: str, db: AsyncSession) -> User:
    """Return the User row for the given Firebase UID or raise 404."""
    user = await db.scalar(select(User).where(User.clerk_id == user_uid))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/log", response_model=LogOut)
async def upsert_log(
    body: LogIn,
    user_uid: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LogOut:
    """Create or update a daily carbon log entry for the authenticated user."""
    user = await _require_user(user_uid, db)
    total = body.transport_kg + body.energy_kg + body.food_kg + body.shopping_kg

    existing = await db.scalar(
        select(DailyLog).where(
            DailyLog.user_id == user.id,
            DailyLog.log_date == body.log_date,
        )
    )
    if existing:
        existing.transport_kg = body.transport_kg
        existing.energy_kg = body.energy_kg
        existing.food_kg = body.food_kg
        existing.shopping_kg = body.shopping_kg
        existing.total_kg = total
        log = existing
    else:
        log = DailyLog(
            user_id=user.id,
            log_date=body.log_date,
            transport_kg=body.transport_kg,
            energy_kg=body.energy_kg,
            food_kg=body.food_kg,
            shopping_kg=body.shopping_kg,
            total_kg=total,
        )
        db.add(log)
    await db.commit()
    await db.refresh(log)
    return LogOut(**log.__dict__)


@router.get("/monthly", response_model=MonthlyOut)
async def get_monthly(
    year: Optional[int] = None,
    month: Optional[int] = None,
    user_uid: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MonthlyOut:
    """Return aggregated monthly carbon emissions for the authenticated user."""
    today = date.today()
    y = year or today.year
    m = month or today.month

    user = await _require_user(user_uid, db)

    start = date(y, m, 1)
    end = date(y + 1, 1, 1) if m == 12 else date(y, m + 1, 1)

    logs = (await db.scalars(
        select(DailyLog).where(
            DailyLog.user_id == user.id,
            DailyLog.log_date >= start,
            DailyLog.log_date < end,
        )
    )).all()

    if not logs:
        survey = await db.scalar(
            select(Survey)
            .where(Survey.user_id == user.id)
            .order_by(Survey.created_at.desc())
        )
        if survey:
            return MonthlyOut(
                transport_kg=round(survey.transport_kg / 12, 1),
                energy_kg=round(survey.energy_kg / 12, 1),
                food_kg=round(survey.food_kg / 12, 1),
                shopping_kg=round(survey.shopping_kg / 12, 1),
                total_kg=round(survey.baseline_kg / 12, 1),
            )
        raise HTTPException(status_code=404, detail="No data found — log some emissions first")

    t = sum(log.transport_kg for log in logs)
    e = sum(log.energy_kg for log in logs)
    f = sum(log.food_kg for log in logs)
    s = sum(log.shopping_kg for log in logs)
    return MonthlyOut(
        transport_kg=round(t, 1),
        energy_kg=round(e, 1),
        food_kg=round(f, 1),
        shopping_kg=round(s, 1),
        total_kg=round(t + e + f + s, 1),
    )
