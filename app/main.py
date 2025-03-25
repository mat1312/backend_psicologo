# Entry point dell'applicazione FastAPI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.db.session import engine
from app.models.user import Base

settings = get_settings()

# Crea le tabelle nel database (in produzione usare Alembic)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    description="API backend per l'applicazione Psicologo Virtuale",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
)

# Configura CORS
if settings.DEBUG:
    # In sviluppo, consenti tutte le origini
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # In produzione, limita alle origini specifiche
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["https://tua-app-frontend.com"],  # Modifica con il dominio del tuo frontend
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )

# Includi il router API v1
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    """
    Root endpoint per verificare che l'API sia in esecuzione
    """
    return {
        "message": f"Benvenuto nell'API di {settings.PROJECT_NAME}",
        "documentation": f"{settings.API_V1_PREFIX}/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)