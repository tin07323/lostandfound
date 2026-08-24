from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user_claims, get_current_user
from app.models.models import School, User, SchoolSetting
from app.schemas.auth import SchoolCreate, JoinSchoolRequest, UserResponse, SchoolResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication & Workspace"])

@router.post("/create-school", response_model=SchoolResponse)
def create_school(
    school_data: SchoolCreate,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    existing_school = db.query(School).filter(School.join_code == school_data.join_code).first()
    if existing_school:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Join code already exists. Choose a unique code."
        )

    new_school = School(name=school_data.name, join_code=school_data.join_code)
    db.add(new_school)
    db.commit()
    db.refresh(new_school)

    settings = SchoolSetting(school_id=new_school.id)
    db.add(settings)

    auth_user_id = claims.get("id")
    email = claims.get("email")
    user_name = claims.get("user_metadata", {}).get("name", email.split("@")[0] if email else "Admin")

    admin_user = User(
        school_id=new_school.id,
        auth_user_id=auth_user_id,
        name=user_name,
        email=email,
        role="admin"
    )
    db.add(admin_user)
    db.commit()

    return new_school

@router.post("/join-school", response_model=UserResponse)
def join_school(
    payload: JoinSchoolRequest,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db)
):
    auth_user_id = claims.get("id")
    email = claims.get("email")

    existing_user = db.query(User).filter(User.auth_user_id == auth_user_id).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already belongs to a school workspace."
        )

    school = db.query(School).filter(School.join_code == payload.join_code, School.is_active == True).first()
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid join code or inactive school workspace."
        )

    new_user = User(
        school_id=school.id,
        auth_user_id=auth_user_id,
        name=payload.name,
        email=email,
        role="student"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user