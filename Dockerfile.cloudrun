# ── Stage 1: Build the React SPA ────────────────────────────────────────────
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Production Python backend + serve built static files ─────────
FROM python:3.12-slim AS runner
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY main.py nudge_engine.py ./
COPY src/ ./src/

# Copy the built React SPA into Nginx's public web root
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# Nginx config: serve SPA for all routes, proxy /api/* to FastAPI on :8000
COPY nginx/nginx-cloudrun.conf /etc/nginx/nginx.conf

# Startup script: launch Uvicorn (backend) + Nginx (frontend) concurrently
COPY scripts/start.sh ./scripts/start.sh
RUN chmod +x ./scripts/start.sh

# Cloud Run requires the container to listen on $PORT (default 8080)
ENV PORT=8080
EXPOSE 8080

CMD ["./scripts/start.sh"]
