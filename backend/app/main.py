from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.config import UPLOAD_DIR
import os

app = FastAPI(
    title="Stone Replacement API",
    description="AI-powered stone replacement service using SAM, MiDaS, and SDXL",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api", tags=["stone-replacement"])

@app.get("/")
async def root():
    return {
        "message": "Stone Replacement API",
        "version": "1.0.0",
        "endpoints": {
            "upload": "/api/upload",
            "mask": "/api/mask",
            "depth": "/api/depth",
            "generate": "/api/generate",
            "status": "/api/status/{task_id}",
            "result": "/api/result/{task_id}",
            "uploads": "/api/uploads/{filename}"
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

os.makedirs(UPLOAD_DIR, exist_ok=True)
