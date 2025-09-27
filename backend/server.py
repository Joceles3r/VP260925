#!/usr/bin/env python3
"""
VISUAL Platform Backend Server - Production Ready
FastAPI server optimized for production deployment
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
import os
import json
import logging
import time
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI app configuration
app = FastAPI(
    title="VISUAL Platform API",
    description="API for VISUAL investment platform - Production Ready",
    version="1.0.0",
    docs_url="/api/docs" if os.getenv("NODE_ENV") != "production" else None,
    redoc_url="/api/redoc" if os.getenv("NODE_ENV") != "production" else None,
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure properly in production
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.replit.dev",
        "https://*.replit.app"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log API requests
    if request.url.path.startswith("/api"):
        logger.info(
            f"{request.method} {request.url.path} - "
            f"{response.status_code} - {process_time:.4f}s"
        )
    
    return response

# Pydantic models
class User(BaseModel):
    id: str
    email: str
    firstName: str
    lastName: str
    profileType: str
    balanceEUR: str
    totalInvested: str
    totalGains: str
    simulationMode: bool
    kycVerified: bool
    isAdmin: bool
    isCreator: bool

class Project(BaseModel):
    id: str
    title: str
    description: str
    category: str
    targetAmount: float
    currentAmount: float
    status: str
    creatorId: str
    mlScore: Optional[float]

class ApiResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None

# Routes
@app.get("/api/health")
async def health_check():
    return {
        "success": True,
        "message": "VISUAL API is healthy",
        "status": "running"
    }

@app.get("/api/auth/me")
async def get_current_user():
    # Mock user for development
    user_data = {
        "id": "demo-user-1",
        "email": "demo@visual.com",
        "firstName": "Demo",
        "lastName": "User",
        "profileType": "investor",
        "balanceEUR": "10000.00",
        "totalInvested": "0.00",
        "totalGains": "0.00",
        "simulationMode": True,
        "kycVerified": False,
        "isAdmin": False,
        "isCreator": False
    }
    
    return {
        "success": True,
        "data": user_data
    }

@app.get("/api/projects")
async def get_projects(
    category: Optional[str] = None,
    status: str = "active",
    page: int = 1,
    limit: int = 20
):
    # Mock projects data
    projects = [
        {
            "id": "proj-1",
            "title": "Documentaire sur l'IA",
            "description": "Un documentaire innovant explorant l'impact de l'intelligence artificielle sur notre société.",
            "category": "documentaire",
            "targetAmount": 5000.0,
            "currentAmount": 1250.0,
            "status": "active",
            "creatorId": "creator-1",
            "mlScore": 7.5,
            "thumbnailUrl": None,
            "videoUrl": None,
            "investorCount": 25,
            "votesCount": 150,
            "creator": {
                "id": "creator-1",
                "firstName": "Marie",
                "lastName": "Dubois",
                "profileImageUrl": None
            }
        },
        {
            "id": "proj-2",
            "title": "Court-métrage Animation",
            "description": "Une histoire touchante en animation 3D sur l'amitié et le courage.",
            "category": "animation",
            "targetAmount": 8000.0,
            "currentAmount": 3200.0,
            "status": "active",
            "creatorId": "creator-2",
            "mlScore": 8.2,
            "thumbnailUrl": None,
            "videoUrl": None,
            "investorCount": 42,
            "votesCount": 280,
            "creator": {
                "id": "creator-2",
                "firstName": "Thomas",
                "lastName": "Martin",
                "profileImageUrl": None
            }
        }
    ]
    
    # Apply filters
    filtered_projects = projects
    if category:
        filtered_projects = [p for p in filtered_projects if p["category"] == category]
    if status:
        filtered_projects = [p for p in filtered_projects if p["status"] == status]
    
    # Pagination
    total = len(filtered_projects)
    start = (page - 1) * limit
    end = start + limit
    paginated_projects = filtered_projects[start:end]
    
    return {
        "success": True,
        "data": paginated_projects,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit
        }
    }

@app.get("/api/investments")
async def get_investments(page: int = 1, limit: int = 20):
    # Mock investments data
    investments = [
        {
            "id": "inv-1",
            "userId": "demo-user-1",
            "projectId": "proj-1",
            "amount": "50.00",
            "currentValue": "52.50",
            "roi": "0.05",
            "createdAt": "2024-01-15T10:00:00Z",
            "project": {
                "id": "proj-1",
                "title": "Documentaire sur l'IA",
                "category": "documentaire",
                "status": "active",
                "thumbnailUrl": None
            }
        }
    ]
    
    return {
        "success": True,
        "data": investments,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": len(investments),
            "totalPages": 1
        }
    }

@app.get("/api/notifications")
async def get_notifications(page: int = 1, limit: int = 20):
    # Mock notifications
    notifications = [
        {
            "id": "notif-1",
            "title": "Nouveau projet disponible",
            "message": "Un nouveau documentaire vient d'être publié et recherche des investisseurs.",
            "type": "new_project",
            "isRead": False,
            "createdAt": "2024-01-20T14:30:00Z",
            "project": None
        }
    ]
    
    return {
        "success": True,
        "data": notifications,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": len(notifications),
            "totalPages": 1
        }
    }

@app.post("/api/logout")
async def logout():
    return {
        "success": True,
        "message": "Logged out successfully"
    }

# For any other routes, return 404
@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def catch_all(path: str):
    return {
        "success": False,
        "error": f"Route not found: /{path}"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
