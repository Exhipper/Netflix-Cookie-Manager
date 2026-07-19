from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import requests
from datetime import datetime

app = FastAPI(title="Netflix Cookie Manager API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class Cookie(BaseModel):
    id: int
    plan: str
    status: str
    country: Optional[str] = None
    last_checked_at: str

class CookieValidateRequest(BaseModel):
    cookie: str

# Mock data (replace with real database later)
mock_cookies = [
    {"id": 1, "plan": "Premium", "status": "live", "country": "US", "last_checked_at": datetime.now().isoformat()},
    {"id": 2, "plan": "Standard", "status": "live", "country": "UK", "last_checked_at": datetime.now().isoformat()},
    {"id": 3, "plan": "Basic", "status": "die", "country": "CA", "last_checked_at": datetime.now().isoformat()},
    {"id": 4, "plan": "Premium", "status": "live", "country": "DE", "last_checked_at": datetime.now().isoformat()},
    {"id": 5, "plan": "Standard with Ads", "status": "live", "country": "FR", "last_checked_at": datetime.now().isoformat()},
]

# Endpoints
@app.get("/api/v1/cookies")
async def get_cookies():
    return {"total": len(mock_cookies), "cookies": mock_cookies}

@app.post("/api/v1/cookies/validate")
async def validate_cookie(request: CookieValidateRequest):
    # In production, validate against Netflix API
    return {
        "valid": True,
        "plan": "Premium",
        "country": "US",
        "status": "active",
        "expiry": "2026-12-31",
        "screens": 4,
        "quality": "4K"
    }

@app.get("/api/v1/stats")
async def get_stats():
    return {
        "total_visitors": 1192,
        "online_now": 7,
        "total_cookies": 259,
        "total_contributors": 7
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
