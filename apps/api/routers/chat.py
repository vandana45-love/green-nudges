from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services.ai_service import stream_chat
from middleware.firebase_auth import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatIn(BaseModel):
    message: str
    history: list[ChatMessage] = []


@router.post("")
async def chat_endpoint(
    body: ChatIn,
    _: str = Depends(get_current_user),  # auth required; uid unused for stateless chat
):
    async def token_generator():
        async for token in stream_chat(body.message, [m.model_dump() for m in body.history]):
            yield f"data: {token}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(token_generator(), media_type="text/event-stream")
