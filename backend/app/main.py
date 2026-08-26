from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db, engine, Base
import app.models
from app.routes import auth, found_items, lost_reports, claims, matches, admin

try:
    Base.metadata.create_all(bind=engine)
    print("SUCCESS: Database tables verified in Supabase!")
except Exception as err:
    print(f"DATABASE ERROR: {err}")

app = FastAPI(title="Lost & Found API", version="1.0.0")

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