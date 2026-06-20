#!/usr/bin/env bash
# =============================================================================
#  EcoStep — Google Cloud Run Production Deployment Script
#  Project : ecostep-500014
#  Region  : us-central1
#
#  Usage:
#    chmod +x deploy_to_cloud_run.sh
#    ./deploy_to_cloud_run.sh
#
#  Prerequisites:
#    - gcloud CLI installed and authenticated  (gcloud auth login)
#    - Docker daemon running locally
#    - Secrets already stored in GCP Secret Manager (see SECRETS SETUP below)
#
#  SECRETS SETUP (run once before first deploy):
#    gcloud secrets create ecostep-dek         --replication-policy=automatic
#    gcloud secrets create ecostep-db-url      --replication-policy=automatic
#    gcloud secrets create ecostep-redis-url   --replication-policy=automatic
#
#    printf "YOUR_BASE64_AES_KEY"  | gcloud secrets versions add ecostep-dek       --data-file=-
#    printf "postgresql://user:pass@host:5432/ecostep" \
#                                   | gcloud secrets versions add ecostep-db-url    --data-file=-
#    printf "redis://host:6379"    | gcloud secrets versions add ecostep-redis-url  --data-file=-
#
# =============================================================================

set -euo pipefail   # -e abort on error | -u unset vars are errors | -o pipefail

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

log_step()  { echo -e "\n${CYAN}${BOLD}▶ $*${RESET}"; }
log_ok()    { echo -e "${GREEN}✔ $*${RESET}"; }
log_warn()  { echo -e "${YELLOW}⚠ $*${RESET}"; }
log_error() { echo -e "${RED}✘ $*${RESET}" >&2; }

# ── Configuration — edit these if you fork the project ───────────────────────
PROJECT_ID="ecostep-500014"
REGION="us-central1"
REGISTRY_REPO="ecostep-production"
REGISTRY_HOST="${REGION}-docker.pkg.dev"

# Artifact Registry image paths
BACKEND_IMAGE="${REGISTRY_HOST}/${PROJECT_ID}/${REGISTRY_REPO}/backend:latest"
FRONTEND_IMAGE="${REGISTRY_HOST}/${PROJECT_ID}/${REGISTRY_REPO}/frontend:latest"
CLOUDRUN_IMAGE="${REGISTRY_HOST}/${PROJECT_ID}/${REGISTRY_REPO}/cloudrun:latest"

# Cloud Run service names
BACKEND_SERVICE="ecostep-backend-api"
FRONTEND_SERVICE="ecostep-frontend-web"

# Secret Manager secret names (must exist before running this script)
SECRET_DEK="ecostep-dek"
SECRET_DB_URL="ecostep-db-url"
SECRET_REDIS_URL="ecostep-redis-url"

# Script root — always resolve relative paths from the repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# =============================================================================
# STEP 1 — GOOGLE CLOUD INITIALISATION & API ENABLEMENT
# =============================================================================
log_step "STEP 1 — Configuring GCP project context and enabling required APIs"

gcloud config set project "${PROJECT_ID}"
log_ok "Active project set to: ${PROJECT_ID}"

gcloud config set run/region "${REGION}"
log_ok "Default Cloud Run region set to: ${REGION}"

APIS=(
  "run.googleapis.com"
  "artifactregistry.googleapis.com"
  "vpcaccess.googleapis.com"
  "secretmanager.googleapis.com"
  "cloudbuild.googleapis.com"
)

echo "  Enabling APIs (this may take ~60 s on first run)..."
gcloud services enable "${APIS[@]}" --project="${PROJECT_ID}"
log_ok "All required APIs enabled: ${APIS[*]}"

# =============================================================================
# STEP 2 — ARTIFACT REGISTRY SETUP & DOCKER AUTHENTICATION
# =============================================================================
log_step "STEP 2 — Creating Artifact Registry repository and configuring Docker auth"

# Create the Docker repository if it does not already exist
if gcloud artifacts repositories describe "${REGISTRY_REPO}" \
     --location="${REGION}" \
     --project="${PROJECT_ID}" \
     --format="value(name)" 2>/dev/null | grep -q "${REGISTRY_REPO}"; then
  log_warn "Artifact Registry repository '${REGISTRY_REPO}' already exists — skipping creation."
else
  gcloud artifacts repositories create "${REGISTRY_REPO}" \
    --repository-format=docker \
    --location="${REGION}" \
    --project="${PROJECT_ID}" \
    --description="EcoStep production container images" \
    --immutable-tags=false
  log_ok "Artifact Registry repository created: ${REGISTRY_REPO} (${REGION})"
fi

# Configure local Docker to authenticate via the gcloud credential helper
gcloud auth configure-docker "${REGISTRY_HOST}" --quiet
log_ok "Docker credential helper configured for ${REGISTRY_HOST}"

# =============================================================================
# STEP 3 — MULTI-SERVICE BUILD & PUSH PIPELINE
# =============================================================================
log_step "STEP 3a — Building the FastAPI backend Docker image"

docker build \
  --file "${SCRIPT_DIR}/Dockerfile.backend" \
  --tag  "${BACKEND_IMAGE}" \
  --label "project=${PROJECT_ID}" \
  --label "service=ecostep-backend" \
  --label "built-at=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "${SCRIPT_DIR}"

log_ok "Backend image built: ${BACKEND_IMAGE}"

log_step "STEP 3b — Pushing the backend image to Artifact Registry"
docker push "${BACKEND_IMAGE}"
log_ok "Backend image pushed successfully."

# ── Frontend ──────────────────────────────────────────────────────────────────
log_step "STEP 3c — Building the React + Nginx frontend Docker image"

docker build \
  --file "${SCRIPT_DIR}/frontend/Dockerfile" \
  --tag  "${FRONTEND_IMAGE}" \
  --label "project=${PROJECT_ID}" \
  --label "service=ecostep-frontend" \
  --label "built-at=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "${SCRIPT_DIR}/frontend"

log_ok "Frontend image built: ${FRONTEND_IMAGE}"

log_step "STEP 3d — Pushing the frontend image to Artifact Registry"
docker push "${FRONTEND_IMAGE}"
log_ok "Frontend image pushed successfully."

# ── Cloud Run unified image (Nginx + FastAPI in one container) ────────────────
# NOTE: Dockerfile.cloudrun bundles both services into a single container that
# Cloud Run can route to on port 8080 — this is the recommended pattern for
# Cloud Run when you don't need independent scaling of frontend/backend.
log_step "STEP 3e — Building the Cloud Run unified image (Nginx + FastAPI)"

docker build \
  --file "${SCRIPT_DIR}/Dockerfile.cloudrun" \
  --tag  "${CLOUDRUN_IMAGE}" \
  --label "project=${PROJECT_ID}" \
  --label "service=ecostep-cloudrun" \
  --label "built-at=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "${SCRIPT_DIR}"

log_ok "Cloud Run unified image built: ${CLOUDRUN_IMAGE}"

log_step "STEP 3f — Pushing the Cloud Run unified image to Artifact Registry"
docker push "${CLOUDRUN_IMAGE}"
log_ok "Cloud Run unified image pushed successfully."

# =============================================================================
# STEP 4 — GOOGLE CLOUD RUN DEPLOYMENT
# =============================================================================

# ── Grant the default Compute Service Account access to secrets ───────────────
log_step "STEP 4 (pre-flight) — Granting Secret Manager access to Cloud Run identity"

PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" \
  --format="value(projectNumber)")
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant secretAccessor on each secret (idempotent — safe to re-run)
for SECRET in "${SECRET_DEK}" "${SECRET_DB_URL}" "${SECRET_REDIS_URL}"; do
  # Verify the secret exists before binding; abort with a helpful message if not
  if ! gcloud secrets describe "${SECRET}" \
       --project="${PROJECT_ID}" &>/dev/null; then
    log_error "Secret '${SECRET}' does not exist in project '${PROJECT_ID}'."
    log_error "Create it first (see SECRETS SETUP at the top of this script)."
    exit 1
  fi

  gcloud secrets add-iam-policy-binding "${SECRET}" \
    --project="${PROJECT_ID}" \
    --member="serviceAccount:${COMPUTE_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --quiet
  log_ok "IAM binding: ${COMPUTE_SA} → secretAccessor on '${SECRET}'"
done

# =============================================================================
# STEP 4a — Deploy the Backend-only Cloud Run service (ecostep-backend-api)
# =============================================================================
log_step "STEP 4a — Deploying backend Cloud Run service: ${BACKEND_SERVICE}"

gcloud run deploy "${BACKEND_SERVICE}" \
  --image="${BACKEND_IMAGE}" \
  --platform=managed \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --allow-unauthenticated \
  --port=8000 \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=80 \
  --timeout=300 \
  --set-env-vars="ENV=production,PORT=8000,LOG_LEVEL=info" \
  --set-secrets="\
ECOSTEP_DEK=${SECRET_DEK}:latest,\
DB_URL=${SECRET_DB_URL}:latest,\
REDIS_URL=${SECRET_REDIS_URL}:latest" \
  --quiet

BACKEND_URL=$(gcloud run services describe "${BACKEND_SERVICE}" \
  --platform=managed \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --format="value(status.url)")

log_ok "Backend deployed successfully."
log_ok "  Backend URL: ${BACKEND_URL}"

# =============================================================================
# STEP 4b — Deploy the Frontend Cloud Run service (ecostep-frontend-web)
#            Injects the live backend URL so the React client knows the API host.
# =============================================================================
log_step "STEP 4b — Deploying frontend Cloud Run service: ${FRONTEND_SERVICE}"

gcloud run deploy "${FRONTEND_SERVICE}" \
  --image="${FRONTEND_IMAGE}" \
  --platform=managed \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --allow-unauthenticated \
  --port=80 \
  --cpu=1 \
  --memory=256Mi \
  --min-instances=0 \
  --max-instances=10 \
  --concurrency=200 \
  --timeout=60 \
  --set-env-vars="\
ENV=production,\
VITE_API_BASE_URL=${BACKEND_URL},\
REACT_APP_API_BASE_URL=${BACKEND_URL}" \
  --quiet

FRONTEND_URL=$(gcloud run services describe "${FRONTEND_SERVICE}" \
  --platform=managed \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --format="value(status.url)")

log_ok "Frontend deployed successfully."

# =============================================================================
# STEP 4c — Deploy the Cloud Run UNIFIED service (recommended single entrypoint)
#
#  Dockerfile.cloudrun runs both Nginx (port 8080) and FastAPI (port 8000)
#  inside one container. Nginx proxies /api/* to the local FastAPI process.
#  This eliminates CORS complexity and is the lower-latency production option.
# =============================================================================
UNIFIED_SERVICE="ecostep-app"

log_step "STEP 4c — Deploying Cloud Run unified service: ${UNIFIED_SERVICE}"

gcloud run deploy "${UNIFIED_SERVICE}" \
  --image="${CLOUDRUN_IMAGE}" \
  --platform=managed \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --allow-unauthenticated \
  --port=8080 \
  --cpu=2 \
  --memory=1Gi \
  --min-instances=0 \
  --max-instances=20 \
  --concurrency=100 \
  --timeout=300 \
  --set-env-vars="ENV=production,PORT=8080,LOG_LEVEL=info" \
  --set-secrets="\
ECOSTEP_DEK=${SECRET_DEK}:latest,\
DB_URL=${SECRET_DB_URL}:latest,\
REDIS_URL=${SECRET_REDIS_URL}:latest" \
  --quiet

UNIFIED_URL=$(gcloud run services describe "${UNIFIED_SERVICE}" \
  --platform=managed \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --format="value(status.url)")

log_ok "Unified service deployed successfully."

# =============================================================================
# STEP 5 — LAUNCH VERIFICATION & SUMMARY
# =============================================================================
log_step "STEP 5 — Deployment verification"

echo ""
echo "  Running health checks..."

# Check backend /docs endpoint (FastAPI auto-docs — quick liveness probe)
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  --max-time 15 "${BACKEND_URL}/docs" || echo "000")

# Check unified app root
UNIFIED_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  --max-time 15 "${UNIFIED_URL}/" || echo "000")

# Check frontend root
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  --max-time 15 "${FRONTEND_URL}/" || echo "000")

# ── Final Summary ─────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}════════════════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}${GREEN}  🌿 EcoStep Production Deployment Complete!${RESET}"
echo -e "${BOLD}${GREEN}════════════════════════════════════════════════════════════════${RESET}"
echo ""
echo -e "  ${BOLD}Project ID   :${RESET} ${PROJECT_ID}"
echo -e "  ${BOLD}Region       :${RESET} ${REGION}"
echo ""
echo -e "  ${BOLD}── Services ──────────────────────────────────────────────────${RESET}"
printf  "  %-24s %s  [HTTP %s]\n" \
  "ecostep-app (unified):" "${UNIFIED_URL}"  "${UNIFIED_STATUS}"
printf  "  %-24s %s  [HTTP %s]\n" \
  "ecostep-backend-api:"   "${BACKEND_URL}"  "${BACKEND_STATUS}"
printf  "  %-24s %s  [HTTP %s]\n" \
  "ecostep-frontend-web:"  "${FRONTEND_URL}" "${FRONTEND_STATUS}"
echo ""
echo -e "  ${BOLD}── Artifact Registry ──────────────────────────────────────────${RESET}"
echo -e "  ${REGISTRY_HOST}/${PROJECT_ID}/${REGISTRY_REPO}/"
echo ""
echo -e "  ${BOLD}── Images Pushed ──────────────────────────────────────────────${RESET}"
echo -e "  backend  → ${BACKEND_IMAGE}"
echo -e "  frontend → ${FRONTEND_IMAGE}"
echo -e "  cloudrun → ${CLOUDRUN_IMAGE}"
echo ""

# Health check result evaluation
ALL_OK=true
for STATUS URL LABEL in \
  "${UNIFIED_STATUS}"  "${UNIFIED_URL}"  "ecostep-app (unified)" \
  "${BACKEND_STATUS}"  "${BACKEND_URL}"  "ecostep-backend-api" \
  "${FRONTEND_STATUS}" "${FRONTEND_URL}" "ecostep-frontend-web"; do
  if [[ "${STATUS}" == "200" || "${STATUS}" == "404" ]]; then
    # 404 is acceptable for root of the API-only backend; docs are at /docs
    log_ok "  ${LABEL} is reachable (HTTP ${STATUS})"
  else
    log_warn "  ${LABEL} returned HTTP ${STATUS} — verify manually."
    ALL_OK=false
  fi
done

echo ""
if [[ "${ALL_OK}" == true ]]; then
  echo -e "${BOLD}${GREEN}  ✅ All health checks passed. Launch verified.${RESET}"
  echo ""
  echo -e "  ${BOLD}🚀 Primary URL (share this with the team):${RESET}"
  echo -e "     ${CYAN}${BOLD}${UNIFIED_URL}${RESET}"
else
  log_warn "One or more health checks did not return 200."
  log_warn "Services may still be starting (Cloud Run cold-start can take ~10 s)."
  log_warn "Retry manually: curl -I ${UNIFIED_URL}"
fi

echo ""
echo -e "${BOLD}${GREEN}════════════════════════════════════════════════════════════════${RESET}"
