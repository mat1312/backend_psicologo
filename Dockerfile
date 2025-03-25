# Configurazione Docker
FROM python:3.11-slim

WORKDIR /app

# Imposta variabili d'ambiente
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Installa dipendenze
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia il codice dell'applicazione
COPY . .

# Esponi la porta
EXPOSE 8000

# Esegui le migrazioni e avvia l'applicazione
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]