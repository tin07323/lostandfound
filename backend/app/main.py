from fastapi import FastAPI

app = FastAPI(title="Lost & Found API", version="1.0.0")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "Lost & Found API",
        "version": "1.0.0"
    }