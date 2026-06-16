"""
Verify Clerk JWT tokens on every authenticated request.
Fetches Clerk's JWKS once and caches it; re-fetches on unknown kid.
"""
import time
import httpx
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

_JWKS_URL = "https://api.clerk.com/v1/jwks"
_jwks_cache: dict = {}
_jwks_fetched_at: float = 0
_JWKS_TTL = 3600  # re-fetch JWKS at most every hour

bearer = HTTPBearer()


async def _get_jwks() -> dict:
    global _jwks_cache, _jwks_fetched_at
    if _jwks_cache and (time.time() - _jwks_fetched_at) < _JWKS_TTL:
        return _jwks_cache
    async with httpx.AsyncClient(timeout=5) as client:
        r = await client.get(_JWKS_URL)
        r.raise_for_status()
        _jwks_cache = r.json()
        _jwks_fetched_at = time.time()
    return _jwks_cache


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> str:
    """
    Dependency that returns the Clerk user ID (`sub` claim) from the Bearer token.
    Raises 401 if the token is missing, expired, or invalid.
    """
    token = credentials.credentials
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        jwks = await _get_jwks()

        # Find the matching key
        key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
        if key is None:
            # kid not in cache — re-fetch once
            global _jwks_fetched_at
            _jwks_fetched_at = 0
            jwks = await _get_jwks()
            key = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)

        if key is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown signing key")

        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        user_id: str = payload.get("sub", "")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing sub claim")
        return user_id

    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        ) from exc
