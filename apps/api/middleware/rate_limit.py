"""
Sliding-window rate limiting via Redis.
Limits are per Clerk user ID extracted from the JWT sub claim.
Falls back gracefully if Redis is unavailable (allows request, logs warning).
"""
import time
import logging
from fastapi import HTTPException, Request, status

logger = logging.getLogger(__name__)

# (endpoint_prefix, max_requests, window_seconds)
LIMITS = [
    ("/chat", 30, 60),          # 30 chat messages / minute
    ("/recommendations", 10, 60),  # 10 regen calls / minute
    ("/survey", 5, 60),         # 5 survey submits / minute
    ("/carbon/log", 60, 60),    # 60 log writes / minute
]


async def check_rate_limit(request: Request, user_id: str) -> None:
    from services.redis_cache import get_redis

    path = request.url.path
    limit_cfg = next(((p, r, w) for p, r, w in LIMITS if path.startswith(p)), ("/", 120, 60))
    _, max_requests, window = limit_cfg

    key = f"rl:{user_id}:{path}:{int(time.time() // window)}"

    try:
        r = get_redis()
        count = await r.incr(key)
        if count == 1:
            await r.expire(key, window)
        if count > max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please slow down.",
                headers={"Retry-After": str(window)},
            )
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Rate limit Redis unavailable: %s — allowing request", exc)
