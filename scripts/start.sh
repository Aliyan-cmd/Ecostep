#!/bin/bash
set -e

echo "🌿 EcoStep Cloud Run startup..."

# Start FastAPI backend on internal port 8000
uvicorn main:app --host 127.0.0.1 --port 8000 --workers 2 &
BACKEND_PID=$!

echo "✅ Backend started (PID $BACKEND_PID)"

# Wait briefly for backend to be ready before Nginx starts proxying
sleep 2

# Start Nginx in the foreground (keeps container alive)
echo "✅ Starting Nginx on port 8080..."
nginx -g "daemon off;"
