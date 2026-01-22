#!/bin/sh
# ============================================
# PRECISION ENGINE AND DYNO, LLC
# Frontend Docker Entrypoint
# Injects runtime environment variables into the built React app
# ============================================

set -e

# Function to inject runtime environment variables
inject_env_vars() {
    # Create a runtime config file that can be loaded by the frontend
    cat <<EOF > /usr/share/nginx/html/config/runtime-env.js
window.__RUNTIME_CONFIG__ = {
    API_URL: "${REACT_APP_API_URL:-/api/v1}",
    APP_NAME: "${REACT_APP_APP_NAME:-Precision Engine and Dyno}",
    STRIPE_PUBLIC_KEY: "${REACT_APP_STRIPE_PUBLIC_KEY:-}",
    GA_TRACKING_ID: "${REACT_APP_GA_TRACKING_ID:-}",
    ENVIRONMENT: "${NODE_ENV:-production}"
};
EOF

    echo "Runtime environment configuration injected successfully."
}

# Inject environment variables
inject_env_vars

# Execute the main command
exec "$@"
