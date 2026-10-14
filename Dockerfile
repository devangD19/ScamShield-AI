# ScamShield AI - one container serving the React app and the Flask API.

# ---- 1. Build the React frontend ----
FROM node:20-slim AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js tailwind.config.js postcss.config.js ./
COPY public ./public
COPY src ./src
# VITE_API_BASE_URL is left unset so the app calls the API on its own origin.
RUN npm run build

# ---- 2. Python runtime with the model ----
FROM python:3.12-slim
# Single-threaded BLAS: one prediction is tiny, and per-thread buffers cost memory.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    OPENBLAS_NUM_THREADS=1 \
    OMP_NUM_THREADS=1 \
    PORT=10000

RUN useradd --create-home --uid 1000 appuser
WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY --chown=appuser backend/*.py backend/model_metadata.json backend/*.joblib backend/
COPY --from=frontend /app/dist ./dist

USER appuser
EXPOSE 10000

# One worker keeps memory low (the model is loaded once per worker); threads handle concurrency.
CMD gunicorn --chdir backend --workers 1 --threads 4 --timeout 120 \
    --bind 0.0.0.0:${PORT} --access-logfile - "app:create_app()"
