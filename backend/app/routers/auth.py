from fastapi import APIRouter, HTTPException
from app.database import get_supabase
from app.models.schemas import LoginRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login(data: LoginRequest):
    """
    Authenticate via Supabase Auth and return the session + user role.
    The role is stored in user_metadata.role (set via Supabase dashboard).
    """
    sb = get_supabase()
    try:
        res = sb.auth.sign_in_with_password({"email": data.email, "password": data.password})
        user = res.user
        role = (user.user_metadata or {}).get("role", "huminiti")
        return {
            "access_token": res.session.access_token,
            "refresh_token": res.session.refresh_token,
            "role": role,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "full_name": (user.user_metadata or {}).get("full_name", ""),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="بيانات الدخول غلط")
