# File di configurazione
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash


class UserRepository:
    """
    Repository per la gestione degli utenti nel database
    """
    
    def __init__(self, db: Session):
        """
        Inizializza il repository con una sessione del database
        
        Args:
            db: Sessione SQLAlchemy attiva
        """
        self.db = db
    
    def get_by_id(self, user_id: int) -> Optional[User]:
        """
        Recupera un utente tramite ID
        
        Args:
            user_id: ID dell'utente da recuperare
            
        Returns:
            User o None se non trovato
        """
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_by_email(self, email: str) -> Optional[User]:
        """
        Recupera un utente tramite email
        
        Args:
            email: Email dell'utente da recuperare
            
        Returns:
            User o None se non trovato
        """
        return self.db.query(User).filter(User.email == email).first()
    
    def create(self, user_in: UserCreate) -> User:
        """
        Crea un nuovo utente
        
        Args:
            user_in: Dati dell'utente da creare
            
        Returns:
            User creato
        """
        # Crea oggetto User con i dati forniti
        user = User(
            email=user_in.email,
            hashed_password=get_password_hash(user_in.password),
            full_name=user_in.full_name,
            role=user_in.role,
            license_number=user_in.license_number,
            specialization=user_in.specialization,
            date_of_birth=user_in.date_of_birth,
            therapist_id=user_in.therapist_id
        )
        
        # Salva nel database
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def update(self, user: User, user_in: UserUpdate) -> User:
        """
        Aggiorna un utente esistente
        
        Args:
            user: Utente da aggiornare
            user_in: Dati aggiornati dell'utente
            
        Returns:
            User aggiornato
        """
        # Aggiorna i dati dell'utente
        update_data = user_in.dict(exclude_unset=True)
        
        # Gestisci la password in modo speciale
        if "password" in update_data:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
        # Applica gli aggiornamenti all'utente
        for field, value in update_data.items():
            setattr(user, field, value)
        
        # Salva nel database
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def delete(self, user_id: int) -> bool:
        """
        Elimina un utente tramite ID
        
        Args:
            user_id: ID dell'utente da eliminare
            
        Returns:
            True se l'eliminazione è riuscita, False altrimenti
        """
        user = self.get_by_id(user_id)
        if not user:
            return False
        
        self.db.delete(user)
        self.db.commit()
        
        return True
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Recupera tutti gli utenti con paginazione
        
        Args:
            skip: Numero di record da saltare
            limit: Numero massimo di record da restituire
            
        Returns:
            Lista di utenti
        """
        return self.db.query(User).offset(skip).limit(limit).all()
    
    def get_by_role(self, role: UserRole, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Recupera tutti gli utenti con un determinato ruolo
        
        Args:
            role: Ruolo degli utenti da recuperare
            skip: Numero di record da saltare
            limit: Numero massimo di record da restituire
            
        Returns:
            Lista di utenti con il ruolo specificato
        """
        return self.db.query(User).filter(User.role == role).offset(skip).limit(limit).all()
    
    def get_therapist_patients(self, therapist_id: int, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Recupera tutti i pazienti di un terapeuta
        
        Args:
            therapist_id: ID del terapeuta
            skip: Numero di record da saltare
            limit: Numero massimo di record da restituire
            
        Returns:
            Lista di pazienti associati al terapeuta
        """
        return (
            self.db.query(User)
            .filter(User.role == UserRole.PATIENT, User.therapist_id == therapist_id)
            .offset(skip)
            .limit(limit)
            .all()
        )