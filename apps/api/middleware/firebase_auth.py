import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from fastapi import HTTPException, Request
from config import settings

if not firebase_admin._apps:
    try:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {"projectId": settings.firebase_project_id})
    except Exception:
        # Fallback: initialize without credentials (token verification still works for public JWTs)
        firebase_admin.initialize_app(options={"projectId": settings.firebase_project_id})


async def get_current_user(request: Request) -> str:
    """Extract and verify Firebase ID token; returns the user UID."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")

    id_token = auth_header.split("Bearer ", 1)[1]
    try:
        decoded = firebase_auth.verify_id_token(id_token)
        return decoded["uid"]
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
