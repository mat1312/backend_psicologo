# Router principale API v1
from fastapi import APIRouter

from app.api.v1.endpoints import auth

api_router = APIRouter()

# Includi i router degli endpoint
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# Aggiungi qui i nuovi router man mano che li implementi
# api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
# api_router.include_router(therapists.router, prefix="/therapists", tags=["therapists"])
# api_router.include_router(therapy.router, prefix="/therapy", tags=["therapy"])
# api_router.include_router(admin.router, prefix="/admin", tags=["admin"])