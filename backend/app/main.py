from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db, engine, Base
import app.models
from app.routes import auth, found_items, lost_reports, claims, matches, admin, notifications

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

try:
    Base.metadata.create_all(bind=engine)
    print("SUCCESS: Database tables verified in Supabase!")
except Exception as err:
    print(f"DATABASE ERROR: {err}")

app = FastAPI(title="Lost & Found API", version="1.0.0")

# Register rate limiter error handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(found_items.router)
app.include_router(lost_reports.router)
app.include_router(claims.router)
app.include_router(matches.router)
app.include_router(admin.router)
app.include_router(notifications.router)

@app.get("/")
def read_root():
    return {"status": "online", "system": "Lost & Found API", "version": "1.0.0"}

@app.get("/health/db")
def db_health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "message": str(e)}