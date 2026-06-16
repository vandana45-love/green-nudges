import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, carbon, chat, recommendations, survey

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]

app = FastAPI(
    title="Green Nudges API",
    version="0.1.0",
    # Disable /docs + /openapi.json in production
    docs_url=None if os.getenv("ENV") == "production" else "/docs",
    redoc_url=None if os.getenv("ENV") == "production" else "/redoc",
    openapi_url=None if os.getenv("ENV") == "production" else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
    response.headers["Strict-Transport-Security"] = (
        "max-age=63072000; includeSubDomains; preload"
    )
    return response


app.include_router(auth.router)
app.include_router(survey.router)
app.include_router(carbon.router)
app.include_router(recommendations.router)
app.include_router(chat.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
