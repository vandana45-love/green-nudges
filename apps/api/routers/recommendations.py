from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from middleware.firebase_auth import get_current_user
from models import Recommendation, Survey, User
from services.ai_service import generate_recommendations
from services.redis_cache import get_cached, set_cached

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


class RecommendationOut(BaseModel):
    id: int
    category: str
    message: str
    savings_kg: float
    is_read: bool


@router.get("/me", response_model=list[RecommendationOut])
async def get_recommendations(
    user_uid: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = await db.scalar(select(User).where(User.clerk_id == user_uid))
    if not user:
        raise HTTPException(404, "User not found")

    cache_key = f"recs:{user.id}"
    cached = await get_cached(cache_key)
    if cached:
        recs = (
            await db.scalars(
                select(Recommendation)
                .where(Recommendation.user_id == user.id)
                .order_by(Recommendation.generated_at.desc())
                .limit(3)
            )
        ).all()
        if recs:
            return [RecommendationOut(**r.__dict__) for r in recs]

    survey = await db.scalar(
        select(Survey)
        .where(Survey.user_id == user.id)
        .order_by(Survey.created_at.desc())
    )
    if not survey:
        raise HTTPException(404, "Complete onboarding survey first")

    raw_recs = await generate_recommendations(
        transport_kg=survey.transport_kg / 12,
        energy_kg=survey.energy_kg / 12,
        food_kg=survey.food_kg / 12,
        shopping_kg=survey.shopping_kg / 12,
    )

    old = (
        await db.scalars(
            select(Recommendation).where(Recommendation.user_id == user.id)
        )
    ).all()
    for r in old:
        await db.delete(r)

    new_recs = []
    for raw in raw_recs:
        rec = Recommendation(
            user_id=user.id,
            category=str(raw.get("category", "general")),
            message=str(raw.get("message", "")),
            savings_kg=float(raw.get("savings_kg", 0) or 0),  # type: ignore[arg-type]
        )
        db.add(rec)
        new_recs.append(rec)

    await db.commit()
    for r in new_recs:
        await db.refresh(r)

    await set_cached(cache_key, {"generated": True}, ttl=86400)
    return [RecommendationOut(**r.__dict__) for r in new_recs]


@router.patch("/{rec_id}/read")
async def mark_read(
    rec_id: int,
    user_uid: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = await db.scalar(select(User).where(User.clerk_id == user_uid))
    if not user:
        raise HTTPException(404, "User not found")
    # Only allow marking own recommendations as read
    rec = await db.scalar(
        select(Recommendation).where(
            Recommendation.id == rec_id, Recommendation.user_id == user.id
        )
    )
    if not rec:
        raise HTTPException(404, "Recommendation not found")
    await db.execute(
        update(Recommendation).where(Recommendation.id == rec_id).values(is_read=True)
    )
    await db.commit()
    return {"status": "ok"}
