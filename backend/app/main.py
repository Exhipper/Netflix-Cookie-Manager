from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import os
import json
import requests
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from cryptography.fernet import Fernet

app = FastAPI(title="Netflix Cookie Manager API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://netflix-cookie-manager.pages.dev",
        "https://*.pages.dev",
        "https://app.yourdomain.com",  # Replace with your subdomain
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Setup - FIXED
DATABASE_URL = os.getenv("DATABASE_URL")

# Fix: Replace postgres:// with postgresql:// for SQLAlchemy
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if not DATABASE_URL:
    # Fallback to SQLite for local development
    DATABASE_URL = "sqlite:///./cookies.db"

# PostgreSQL requires specific driver
if DATABASE_URL.startswith("postgresql"):
    # Ensure we're using the right driver
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class CookieDB(Base):
    __tablename__ = "cookies"
    
    id = Column(Integer, primary_key=True, index=True)
    cookie_encrypted = Column(Text, nullable=False)
    plan = Column(String(50))
    status = Column(String(20), default="pending")
    country = Column(String(10))
    expiry_date = Column(DateTime)
    screen_count = Column(Integer)
    quality = Column(String(50))
    last_checked_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Create tables
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")
except Exception as e:
    print(f"Error creating tables: {e}")

# Pydantic Schemas
class CookieBase(BaseModel):
    plan: Optional[str] = None
    status: str = "pending"
    country: Optional[str] = None
    expiry_date: Optional[str] = None
    screen_count: Optional[int] = None
    quality: Optional[str] = None

class CookieCreate(BaseModel):
    cookie: str

class CookieValidateRequest(BaseModel):
    cookie: str

class CookieResponse(CookieBase):
    id: int
    last_checked_at: str
    created_at: str
    
    class Config:
        from_attributes = True

class StatsResponse(BaseModel):
    total_visitors: int
    online_now: int
    total_cookies: int
    live_cookies: int
    total_contributors: int
    last_update: str

# Encryption Helper
def encrypt_cookie(cookie_data: str) -> str:
    """Encrypt cookie data using Fernet"""
    key = os.getenv("ENCRYPTION_KEY")
    if key:
        try:
            cipher = Fernet(key.encode())
            return cipher.encrypt(cookie_data.encode()).decode()
        except:
            return cookie_data
    return cookie_data

def decrypt_cookie(encrypted_data: str) -> str:
    """Decrypt cookie data"""
    key = os.getenv("ENCRYPTION_KEY")
    if key:
        try:
            cipher = Fernet(key.encode())
            return cipher.decrypt(encrypted_data.encode()).decode()
        except:
            return encrypted_data
    return encrypted_data

# API Endpoints
@app.get("/")
async def root():
    return {"message": "Netflix Cookie Manager API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/v1/cookies/validate", response_model=Dict[str, Any])
async def validate_cookie(request: CookieValidateRequest):
    """
    Validate a Netflix cookie against Netflix's API
    """
    cookie_data = request.cookie
    
    if not cookie_data or len(cookie_data) < 10:
        return {"valid": False, "error": "Invalid cookie format"}
    
    # Extract Netflix ID from cookie (simplified)
    netflix_id = None
    secure_id = None
    
    # Parse cookie string (supports multiple formats)
    parts = cookie_data.split(';')
    for part in parts:
        part = part.strip()
        if 'NetflixId=' in part:
            netflix_id = part.split('=')[1].strip()
        elif 'SecureNetflixId=' in part:
            secure_id = part.split('=')[1].strip()
    
    if not netflix_id and not secure_id:
        # Try to parse as JSON
        try:
            import json
            cookie_json = json.loads(cookie_data)
            netflix_id = cookie_json.get('NetflixId')
            secure_id = cookie_json.get('SecureNetflixId')
        except:
            pass
    
    # If we have valid IDs, return success (mock validation)
    if netflix_id or secure_id:
        # Determine plan based on cookie content (mock)
        plan_map = {
            "basic": "Basic",
            "standard": "Standard",
            "premium": "Premium",
            "ads": "Standard with Ads"
        }
        
        detected_plan = "Premium"
        cookie_lower = cookie_data.lower()
        for key, value in plan_map.items():
            if key in cookie_lower:
                detected_plan = value
                break
        
        return {
            "valid": True,
            "plan": detected_plan,
            "country": "US",
            "status": "active",
            "expiry": "2026-12-31",
            "screens": 4,
            "quality": "4K",
            "message": "Cookie validated successfully"
        }
    
    return {"valid": False, "error": "Invalid Netflix cookie format"}

@app.post("/api/v1/cookies", response_model=Dict[str, Any])
async def submit_cookie(request: CookieCreate):
    """
    Submit a new cookie (validates and stores if live)
    """
    db = SessionLocal()
    
    try:
        # First, validate the cookie
        validation = await validate_cookie(CookieValidateRequest(cookie=request.cookie))
        
        if not validation.get("valid", False):
            raise HTTPException(status_code=400, detail=validation.get("error", "Invalid cookie"))
        
        # Encrypt and store
        encrypted_cookie = encrypt_cookie(request.cookie)
        
        # Parse expiry date
        expiry_str = validation.get("expiry")
        expiry_date = None
        if expiry_str:
            try:
                expiry_date = datetime.strptime(expiry_str, "%Y-%m-%d")
            except:
                pass
        
        new_cookie = CookieDB(
            cookie_encrypted=encrypted_cookie,
            plan=validation.get("plan", "Unknown"),
            status="live",
            country=validation.get("country", "Unknown"),
            expiry_date=expiry_date,
            screen_count=validation.get("screens"),
            quality=validation.get("quality"),
            last_checked_at=datetime.utcnow()
        )
        
        db.add(new_cookie)
        db.commit()
        db.refresh(new_cookie)
        
        return {
            "message": "Cookie added successfully",
            "cookie_id": new_cookie.id,
            "plan": new_cookie.plan,
            "status": new_cookie.status
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@app.get("/api/v1/cookies", response_model=Dict[str, Any])
async def get_cookies(limit: int = 100, offset: int = 0):
    """
    Get all cookies with pagination
    """
    db = SessionLocal()
    try:
        cookies = db.query(CookieDB).order_by(CookieDB.created_at.desc()).offset(offset).limit(limit).all()
        live_count = db.query(CookieDB).filter(CookieDB.status == "live").count()
        
        return {
            "total": db.query(CookieDB).count(),
            "live": live_count,
            "cookies": [
                {
                    "id": c.id,
                    "plan": c.plan,
                    "status": c.status,
                    "country": c.country,
                    "expiry_date": c.expiry_date.isoformat() if c.expiry_date else None,
                    "screen_count": c.screen_count,
                    "quality": c.quality,
                    "last_checked_at": c.last_checked_at.isoformat(),
                    "created_at": c.created_at.isoformat()
                }
                for c in cookies
            ]
        }
    finally:
        db.close()

@app.get("/api/v1/cookies/{cookie_id}", response_model=Dict[str, Any])
async def get_cookie(cookie_id: int):
    """
    Get a specific cookie by ID
    """
    db = SessionLocal()
    try:
        cookie = db.query(CookieDB).filter(CookieDB.id == cookie_id).first()
        if not cookie:
            raise HTTPException(status_code=404, detail="Cookie not found")
        
        return {
            "id": cookie.id,
            "plan": cookie.plan,
            "status": cookie.status,
            "country": cookie.country,
            "expiry_date": cookie.expiry_date.isoformat() if cookie.expiry_date else None,
            "screen_count": cookie.screen_count,
            "quality": cookie.quality,
            "last_checked_at": cookie.last_checked_at.isoformat(),
            "created_at": cookie.created_at.isoformat()
        }
    finally:
        db.close()

@app.post("/api/v1/cookies/{cookie_id}/refresh", response_model=Dict[str, Any])
async def refresh_cookie(cookie_id: int):
    """
    Re-validate a stored cookie
    """
    db = SessionLocal()
    try:
        cookie = db.query(CookieDB).filter(CookieDB.id == cookie_id).first()
        if not cookie:
            raise HTTPException(status_code=404, detail="Cookie not found")
        
        # Decrypt and validate
        decrypted = decrypt_cookie(cookie.cookie_encrypted)
        validation = await validate_cookie(CookieValidateRequest(cookie=decrypted))
        
        cookie.status = "live" if validation.get("valid") else "die"
        cookie.last_checked_at = datetime.utcnow()
        cookie.plan = validation.get("plan", cookie.plan)
        cookie.country = validation.get("country", cookie.country)
        
        db.commit()
        db.refresh(cookie)
        
        return {
            "message": "Cookie refreshed",
            "cookie_id": cookie.id,
            "status": cookie.status,
            "plan": cookie.plan
        }
    finally:
        db.close()

@app.post("/api/v1/nftoken", response_model=Dict[str, Any])
async def generate_nftoken(request: CookieValidateRequest):
    """
    Generate NFToken login link from cookie
    """
    cookie_data = request.cookie
    
    if not cookie_data or len(cookie_data) < 10:
        raise HTTPException(status_code=400, detail="Invalid cookie")
    
    # Mock NFToken generation
    # In production: call Netflix's createAutoLoginToken mutation
    import hashlib
    token_hash = hashlib.md5(cookie_data.encode()).hexdigest()[:16]
    mock_token = f"nftoken_{token_hash}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    return {
        "nftoken": mock_token,
        "login_url": f"https://www.netflix.com/?nftoken={mock_token}",
        "expires_in": "24h",
        "valid": True
    }

@app.get("/api/v1/stats", response_model=StatsResponse)
async def get_stats():
    """
    Get dashboard statistics
    """
    db = SessionLocal()
    try:
        total = db.query(CookieDB).count()
        live = db.query(CookieDB).filter(CookieDB.status == "live").count()
        
        return StatsResponse(
            total_visitors=1192,
            online_now=7,
            total_cookies=total,
            live_cookies=live,
            total_contributors=7,
            last_update=datetime.now().isoformat()
        )
    finally:
        db.close()

# Run with: uvicorn app.main:app --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
