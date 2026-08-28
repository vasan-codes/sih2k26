from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import missions, model_registry, regions, uploads
from app.db.base import Base
from app.db.session import engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SatQuery AI — Prototype Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5180", "http://127.0.0.1:5180"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(missions.router)
app.include_router(regions.router)
app.include_router(model_registry.router)
app.include_router(uploads.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "satquery-ai-backend", "mode": "DEMO / PROTOTYPE"}
