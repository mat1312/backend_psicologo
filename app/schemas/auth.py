# Endpoint per login e registrazione
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.models.user import UserRole


class Token(BaseModel):
    """Schema per il token JWT di accesso"""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Dati contenuti nel token JWT"""
    email: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[UserRole] = None


class LoginRequest(BaseModel):
    """Schema per la richiesta di login"""
    email: EmailStr
    password: str


class UserCreate(BaseModel):
    """Schema per la creazione di un nuovo utente"""
    email: EmailStr
    password: str
    full_name: str
    role: UserRole
    license_number: Optional[str] = None
    specialization: Optional[str] = None
    date_of_birth: Optional[str] = None
    therapist_id: Optional[int] = None


class UserResponse(BaseModel):
    """Schema per la risposta con i dati dell'utente"""
    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    license_number: Optional[str] = None
    specialization: Optional[str] = None
    date_of_birth: Optional[str] = None
    therapist_id: Optional[int] = None

    class Config:
        orm_mode = True