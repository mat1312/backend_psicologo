# Modelli/Schema utente (paziente, terapeuta)
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class UserRole(str, Enum):
    """Ruoli utente disponibili"""
    ADMIN = "admin"
    THERAPIST = "therapist"
    PATIENT = "patient"


class User(Base):
    """Modello utente per tutti i tipi di utenti (admin, terapeuti, pazienti)"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Campi specifici per i terapeuti
    license_number = Column(String, nullable=True)
    specialization = Column(String, nullable=True)
    
    # Campi specifici per i pazienti
    date_of_birth = Column(DateTime, nullable=True)
    therapist_id = Column(Integer, nullable=True)  # ID del terapeuta assegnato