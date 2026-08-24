import os
import requests
from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from app.database import get_db
from app.models.models import User

dotenv_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
load_dotenv(dotenv_path=dotenv_path)

security = HTTPBearer()

def get_current_user_claims(credentials: HTTPAuthorizationCredentials = Security(security)):
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_anon_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase credentials missing in server environment."
        )

    token = credentials.credentials
    headers = {
        "apikey": supabase_anon_key,
        "Authorization": f"Bearer {token}"
    }

    try:
        response = requests.get(f"{supabase_url}/auth/v1/user", headers=headers, timeout=10)
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token"
            )
        return response.json()
    except requests.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Auth verification request failed: {str(e)}"
        )

def get_current_user(
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
) -> User:
    auth_user_id = claims.get("id")
    user = db.query(User).filter(User.auth_user_id == auth_user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found. Please complete school registration."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive."
        )

    return user