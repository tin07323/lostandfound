from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

app = FastAPI(title="Lost & Found API", version="1.0.0")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "Lost & Found API",
        "version": "1.0.0"
    }

@app.get("/health/db")
def db_health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "message": str(e)}