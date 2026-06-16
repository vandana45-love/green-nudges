"""Clerk webhook → sync user into local DB."""
from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db import get_db
from models import User
from config import settings

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/clerk")
async def clerk_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        from svix.webhooks import Webhook, WebhookVerificationError
        payload = await request.body()
        headers = dict(request.headers)
        wh = Webhook(settings.clerk_webhook_secret)
        event = wh.verify(payload, headers)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = event.get("type")
    data = event.get("data", {})

    if event_type == "user.created":
        clerk_id = data["id"]
        email = data["email_addresses"][0]["email_address"]
        existing = await db.scalar(select(User).where(User.clerk_id == clerk_id))
        if not existing:
            user = User(clerk_id=clerk_id, email=email)
            db.add(user)
            await db.commit()

    return {"status": "ok"}
