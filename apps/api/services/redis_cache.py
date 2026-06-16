import json
import redis.asyncio as aioredis
from config import settings

_pool: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    global _pool
    if _pool is None:
        _pool = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _pool


async def get_cached(key: str) -> dict | None:
    r = get_redis()
    val = await r.get(key)
    return json.loads(val) if val else None


async def set_cached(key: str, value: dict, ttl: int = 86400) -> None:
    r = get_redis()
    await r.set(key, json.dumps(value), ex=ttl)
