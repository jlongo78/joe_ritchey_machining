#!/bin/bash
# ============================================
# PRECISION ENGINE AND DYNO, LLC
# Production Deployment Script
# ============================================
# Usage: ./scripts/deploy.sh [command]
# Commands:
#   deploy     - Full deployment (default)
#   build      - Build images only
#   start      - Start containers
#   stop       - Stop containers
#   restart    - Restart containers
#   logs       - View logs
#   status     - Check status
#   backup     - Backup database
#   rollback   - Rollback to previous version
#   health     - Run health checks
#   clean      - Clean up unused resources
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Configuration
COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"
COMPOSE_PROD_FILE="$PROJECT_DIR/docker-compose.prod.yml"
ENV_FILE="$PROJECT_DIR/.env"
BACKUP_DIR="$PROJECT_DIR/backups"
LOG_FILE="$PROJECT_DIR/logs/deploy.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    local level=$1
    shift
    local message=$@
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

log_info() { log "INFO" "${BLUE}$@${NC}"; }
log_success() { log "SUCCESS" "${GREEN}$@${NC}"; }
log_warn() { log "WARN" "${YELLOW}$@${NC}"; }
log_error() { log "ERROR" "${RED}$@${NC}"; }

# Header
print_header() {
    echo -e "${BLUE}"
    echo "============================================"
    echo "  PRECISION ENGINE AND DYNO, LLC"
    echo "  Deployment Script"
    echo "============================================"
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    # Check Docker Compose
    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    # Check .env file
    if [ ! -f "$ENV_FILE" ]; then
        log_error ".env file not found. Please copy .env.example to .env and configure it."
        exit 1
    fi

    # Validate required environment variables
    source "$ENV_FILE"
    if [ -z "$SECRET_KEY" ] || [ "$SECRET_KEY" == "your-super-secret-key-change-in-production-use-openssl-rand-hex-32" ]; then
        log_error "SECRET_KEY is not set or using default value. Please generate a secure key."
        exit 1
    fi

    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" == "your-jwt-secret-key-change-in-production-use-openssl-rand-hex-32" ]; then
        log_error "JWT_SECRET is not set or using default value. Please generate a secure key."
        exit 1
    fi

    log_success "Prerequisites check passed."
}

# Build Docker images
build_images() {
    log_info "Building Docker images..."

    cd "$PROJECT_DIR"

    if [ -f "$COMPOSE_PROD_FILE" ]; then
        docker compose -f "$COMPOSE_FILE" -f "$COMPOSE_PROD_FILE" build --no-cache
    else
        docker compose -f "$COMPOSE_FILE" build --no-cache
    fi

    log_success "Docker images built successfully."
}

# Pull latest code
pull_latest() {
    log_info "Pulling latest code from repository..."

    cd "$PROJECT_DIR"

    if [ -d ".git" ]; then
        git fetch origin
        git pull origin main
        log_success "Code updated successfully."
    else
        log_warn "Not a git repository. Skipping code pull."
    fi
}

# Backup database before deployment
backup_database() {
    log_info "Backing up database..."

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/precision_engine_${timestamp}.db"

    # Check if backend container is running
    if docker compose -f "$COMPOSE_FILE" ps -q backend &> /dev/null; then
        docker compose -f "$COMPOSE_FILE" exec -T backend \
            sqlite3 /app/data/precision_engine.db ".backup '/tmp/backup.db'" 2>/dev/null || true

        docker compose -f "$COMPOSE_FILE" cp backend:/tmp/backup.db "$backup_file" 2>/dev/null || true

        if [ -f "$backup_file" ]; then
            gzip "$backup_file"
            log_success "Database backed up to: ${backup_file}.gz"
        else
            log_warn "No existing database to backup."
        fi
    else
        log_warn "Backend container not running. Skipping backup."
    fi

    # Clean old backups (keep last 30 days)
    find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete 2>/dev/null || true
}

# Stop containers gracefully
stop_containers() {
    log_info "Stopping containers..."

    cd "$PROJECT_DIR"
    docker compose -f "$COMPOSE_FILE" down --remove-orphans

    log_success "Containers stopped."
}

# Start containers
start_containers() {
    log_info "Starting containers..."

    cd "$PROJECT_DIR"

    if [ -f "$COMPOSE_PROD_FILE" ]; then
        docker compose -f "$COMPOSE_FILE" -f "$COMPOSE_PROD_FILE" up -d
    else
        docker compose -f "$COMPOSE_FILE" up -d
    fi

    log_success "Containers started."
}

# Wait for services to be healthy
wait_for_health() {
    log_info "Waiting for services to be healthy..."

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        log_info "Health check attempt $attempt/$max_attempts..."

        # Check backend health
        if docker compose -f "$COMPOSE_FILE" exec -T backend curl -sf http://localhost:8000/health &> /dev/null; then
            log_success "Backend is healthy."

            # Check frontend health
            if docker compose -f "$COMPOSE_FILE" exec -T frontend curl -sf http://localhost/health &> /dev/null; then
                log_success "Frontend is healthy."
                log_success "All services are healthy!"
                return 0
            fi
        fi

        sleep 5
        attempt=$((attempt + 1))
    done

    log_error "Services did not become healthy within the timeout period."
    return 1
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."

    docker compose -f "$COMPOSE_FILE" exec -T backend alembic upgrade head 2>/dev/null || {
        log_warn "Alembic migrations skipped (may not be configured yet)."
    }

    log_success "Migrations completed."
}

# Clear caches
clear_caches() {
    log_info "Clearing caches..."

    docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli FLUSHDB 2>/dev/null || {
        log_warn "Redis cache clear skipped."
    }

    log_success "Caches cleared."
}

# Full deployment
deploy() {
    print_header
    log_info "Starting full deployment..."

    check_prerequisites
    pull_latest
    backup_database
    build_images
    stop_containers
    start_containers

    sleep 10  # Give containers time to start

    wait_for_health
    run_migrations
    clear_caches

    echo ""
    log_success "=========================================="
    log_success "  Deployment completed successfully!"
    log_success "=========================================="
    echo ""

    show_status
}

# Show container status
show_status() {
    log_info "Current container status:"
    echo ""
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
}

# View logs
view_logs() {
    local service=${1:-}

    if [ -n "$service" ]; then
        docker compose -f "$COMPOSE_FILE" logs -f "$service"
    else
        docker compose -f "$COMPOSE_FILE" logs -f
    fi
}

# Health check
health_check() {
    print_header
    log_info "Running health checks..."

    echo ""
    echo "Backend Health:"
    curl -sf http://localhost:8000/health && echo " - OK" || echo " - FAILED"

    echo ""
    echo "Frontend Health:"
    curl -sf http://localhost/health && echo " - OK" || echo " - FAILED"

    echo ""
    echo "Redis Health:"
    docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping 2>/dev/null && echo "PONG - OK" || echo " - FAILED"

    echo ""
    show_status
}

# Restart containers
restart_containers() {
    log_info "Restarting containers..."
    stop_containers
    start_containers
    wait_for_health
    log_success "Containers restarted successfully."
}

# Rollback to previous version
rollback() {
    log_warn "Rollback functionality requires git tags or image versioning."
    log_info "To rollback manually:"
    echo "  1. git checkout <previous-tag>"
    echo "  2. ./scripts/deploy.sh deploy"
}

# Clean up unused resources
clean_up() {
    log_info "Cleaning up unused Docker resources..."

    docker system prune -f
    docker volume prune -f
    docker image prune -f

    log_success "Cleanup completed."
}

# Show help
show_help() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  deploy     - Full deployment (default)"
    echo "  build      - Build images only"
    echo "  start      - Start containers"
    echo "  stop       - Stop containers"
    echo "  restart    - Restart containers"
    echo "  logs [svc] - View logs (optionally for specific service)"
    echo "  status     - Check container status"
    echo "  backup     - Backup database"
    echo "  rollback   - Rollback instructions"
    echo "  health     - Run health checks"
    echo "  clean      - Clean up unused resources"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy          # Full deployment"
    echo "  $0 logs backend    # View backend logs"
    echo "  $0 restart         # Restart all services"
}

# Main script
main() {
    local command=${1:-deploy}

    case $command in
        deploy)
            deploy
            ;;
        build)
            print_header
            check_prerequisites
            build_images
            ;;
        start)
            print_header
            start_containers
            wait_for_health
            ;;
        stop)
            print_header
            stop_containers
            ;;
        restart)
            print_header
            restart_containers
            ;;
        logs)
            view_logs "$2"
            ;;
        status)
            print_header
            show_status
            ;;
        backup)
            print_header
            backup_database
            ;;
        rollback)
            print_header
            rollback
            ;;
        health)
            health_check
            ;;
        clean)
            print_header
            clean_up
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
