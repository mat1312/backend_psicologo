# Modelli/Schema utente (paziente, terapeuta)
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


# Schema base comune
class UserBase(BaseModel):
    """Schema base per gli utenti"""
    email: EmailStr
    full_name: str
    role: UserRole


# Schema per la creazione di un utente
class UserCreate(UserBase):
    """Schema per la creazione di un nuovo utente"""
    password: str
    license_number: Optional[str] = None
    specialization: Optional[str] = None
    date_of_birth: Optional[date] = None
    therapist_id: Optional[int] = None


# Schema per l'aggiornamento di un utente
class UserUpdate(BaseModel):
    """Schema per l'aggiornamento di un utente esistente"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    license_number: Optional[str] = None
    specialization: Optional[str] = None
    date_of_birth: Optional[date] = None
    therapist_id: Optional[int] = None


# Schema per la lettura dei dati utente
class UserRead(UserBase):
    """Schema per la lettura dei dati utente"""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    license_number: Optional[str] = None
    specialization: Optional[str] = None
    date_of_birth: Optional[date] = None
    therapist_id: Optional[int] = None

    class Config:
        from_attributes = True


# Schema per i terapeuti
class TherapistRead(UserRead):
    """Schema specifico per i terapeuti"""
    license_number: str
    specialization: Optional[str]

    class Config:
        from_attributes = True


# Schema per i pazienti
class PatientRead(UserRead):
    """Schema specifico per i pazienti"""
    date_of_birth: Optional[date]
    therapist_id: Optional[int]

    class Config:
        from_attributes = True


# Schema per elenco di utenti
class UserList(BaseModel):
    """Schema per una lista di utenti"""
    items: list[UserRead]
    total: int