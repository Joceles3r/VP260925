#!/usr/bin/env python3
"""
VISUAL Platform Backend Server
FastAPI server for VISUAL investment platform
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import json

app = FastAPI(
    title="VISUAL API",
    description="API for VISUAL investment platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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