# Endpoint per login e registrazione
from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
    get_current_active_user
)
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.auth import Token, UserCreate, UserResponse, LoginRequest

settings = get_settings()
router = APIRouter()


@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, ottiene un access token per le credenziali
    """
    # Cerca l'utente nel database per email
    user = db.query(User).filter(User.email == form_data.username).first()
    
    # Verifica se l'utente esiste e la password è corretta
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o password non corrette",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verifica se l'utente è attivo
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utente non attivo"
        )
    
    # Crea il token di accesso con payload contenente email e user_id
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id, "role": user.role.value},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/login/json", response_model=Token)
def login_json(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    Endpoint di login con JSON invece di form-data
    """
    # Cerca l'utente nel database per email
    user = db.query(User).filter(User.email == login_data.email).first()
    
    # Verifica se l'utente esiste e la password è corretta
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o password non corrette"
        )
    
    # Verifica se l'utente è attivo
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utente non attivo"
        )
    
    # Crea il token di accesso
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id, "role": user.role.value},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=UserResponse)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
) -> Any:
    """
    Registrazione di un nuovo utente
    """
    # Verifica se esiste già un utente con la stessa email
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email già registrata"
        )
    
    # Crea nuovo utente con password hashata
    new_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role=user_data.role,
        license_number=user_data.license_number,
        specialization=user_data.specialization,
        date_of_birth=user_data.date_of_birth,
        therapist_id=user_data.therapist_id
    )
    
    # Salva l'utente nel database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.get("/me", response_model=UserResponse)
def read_current_user(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Ottieni informazioni sull'utente corrente
    """
    return current_user