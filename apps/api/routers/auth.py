"""Firebase user profile endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db
from middleware.firebase_auth import get_current_user
from models import User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me")
async def get_profile(
    user_uid: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    """Return basic profile information for the authenticated user."""
    user = await db.scalar(select(User).where(User.clerk_id == user_uid))
    if not user:
        return {"uid": user_uid, "has_survey": False}
    return {"uid": user_uid, "has_survey": True, "user_id": user.id}
