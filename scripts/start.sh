#!/bin/bash
set -e

# ===========================================
# 1v1bro Production Stack Startup Script
# ===========================================
# - Auto-clears port conflicts (5173, 8000, 6379)
# - Always rebuilds with --no-cache
# - Professional CI/CD ready
# ===========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Fixed ports
FRONTEND_PORT=5173
BACKEND_PORT=8000
REDIS_PORT=6379

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${CYAN}[STEP]${NC} $1"; }

# ===========================================
# Port Management - Kill anything on our ports
# ===========================================
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$pids" ]; then
        log_warn "Killing processes on port $port: $pids"
        echo "$pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

clear_all_ports() {
    log_step "Clearing port conflicts..."
    kill_port $FRONTEND_PORT
    kill_port $BACKEND_PORT
    kill_port $REDIS_PORT
    log_success "Ports $FRONTEND_PORT, $BACKEND_PORT, $REDIS_PORT cleared"
}

# ===========================================
# Docker Cleanup
# ===========================================
docker_cleanup() {
    log_step "Stopping existing containers..."
    
    # Check if Docker is responsive first
    if ! docker info >/dev/null 2>&1; then
        log_warn "Docker daemon not responding, waiting..."
        sleep 3
        if ! docker info >/dev/null 2>&1; then
            log_error "Docker daemon still not responding. Please restart Docker Desktop."
            return 1
        fi
    fi
    
    docker-compose down --remove-orphans 2>/dev/null || true
    sleep 1
    
    # Kill any orphaned containers using our ports (macOS compatible - no xargs -r)
    for port in $FRONTEND_PORT $BACKEND_PORT $REDIS_PORT; do
        local containers=$(docker ps -q --filter "publish=$port" 2>/dev/null)
        if [ -n "$containers" ]; then
            echo "$containers" | xargs docker stop 2>/dev/null || true
        fi
    done
    
    log_success "Docker cleanup complete"
}

# ===========================================
# Environment Check
# ===========================================
check_env() {
    if [ ! -f ".env" ]; then
        log_warn ".env file not found. Creating from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_warn "⚠️  Please edit .env with your configuration!"
        else
            log_error ".env.example not found!"
            exit 1
        fi
    fi
    
    # Override ports in env
    export FRONTEND_PORT=$FRONTEND_PORT
    export BACKEND_PORT=$BACKEND_PORT
    export REDIS_PORT=$REDIS_PORT
}

# ===========================================
# Health Check with Retry
# ===========================================
wait_for_healthy() {
    local service=$1
    local url=$2
    local max_attempts=30
    local attempt=1
    
    log_info "Waiting for $service to be healthy..."
    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|204"; then
            log_success "$service is healthy!"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    echo ""
    log_error "$service failed to become healthy after $max_attempts attempts"
    return 1
}

# ===========================================
# Wait for Docker daemon
# ===========================================
wait_for_docker() {
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker info >/dev/null 2>&1; then
            return 0
        fi
        log_warn "Waiting for Docker daemon (attempt $attempt/$max_attempts)..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "Docker daemon not available after $max_attempts attempts"
    return 1
}

# ===========================================
# PRODUCTION MODE
# ===========================================
start_prod() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║     1v1bro Production Stack Launch     ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
    echo ""
    
    # Step 0: Ensure Docker is running
    wait_for_docker || exit 1
    
    # Step 1: Clear everything
    clear_all_ports
    docker_cleanup || exit 1
    check_env
    
    # Ensure Docker is still responsive after cleanup
    wait_for_docker || exit 1
    
    # Step 2: Build with no cache
    log_step "Building Docker images (--no-cache)..."
    docker-compose build --no-cache --parallel
    log_success "Build complete"
    
    # Step 3: Start services
    log_step "Starting services..."
    docker-compose up -d
    
    # Step 4: Wait for health
    echo ""
    wait_for_healthy "Backend" "http://localhost:$BACKEND_PORT/health"
    wait_for_healthy "Frontend" "http://localhost:$FRONTEND_PORT/health"
    
    # Step 5: Show status
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║         Stack Running Successfully     ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${CYAN}Frontend:${NC}  http://localhost:$FRONTEND_PORT"
    echo -e "  ${CYAN}Backend:${NC}   http://localhost:$BACKEND_PORT"
    echo -e "  ${CYAN}API Docs:${NC}  http://localhost:$BACKEND_PORT/docs"
    echo -e "  ${CYAN}Health:${NC}    http://localhost:$BACKEND_PORT/health"
    echo ""
    
    docker-compose ps
}

# ===========================================
# RESTART MODE (always no-cache)
# ===========================================
restart_stack() {
    echo ""
    log_step "Restarting stack with fresh build..."
    start_prod
}

# ===========================================
# DEVELOPMENT MODE
# ===========================================
start_dev() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║     1v1bro Development Mode            ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
    echo ""
    
    clear_all_ports
    docker_cleanup
    check_env
    
    # Start Redis in Docker
    log_step "Starting Redis..."
    docker-compose up -d redis
    sleep 3
    
    # Backend with hot reload
    log_step "Starting backend (hot reload)..."
    cd backend
    python -m uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload &
    BACKEND_PID=$!
    cd ..
    
    # Frontend dev server
    log_step "Starting frontend (hot reload)..."
    cd frontend
    npm run dev -- --port $FRONTEND_PORT --host &
    FRONTEND_PID=$!
    cd ..
    
    sleep 5
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║       Development Servers Running      ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${CYAN}Frontend:${NC}  http://localhost:$FRONTEND_PORT"
    echo -e "  ${CYAN}Backend:${NC}   http://localhost:$BACKEND_PORT"
    echo -e "  ${CYAN}API Docs:${NC}  http://localhost:$BACKEND_PORT/docs"
    echo ""
    echo -e "  ${YELLOW}Press Ctrl+C to stop${NC}"
    echo ""
    
    # Cleanup on exit
    trap "log_info 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker-compose down; log_success 'Stopped'" EXIT INT TERM
    wait
}

# ===========================================
# STOP ALL
# ===========================================
stop_all() {
    echo ""
    log_step "Stopping all services..."
    
    clear_all_ports
    docker_cleanup
    
    # Kill any remaining node/python processes for this project
    pkill -f "uvicorn app.main:app" 2>/dev/null || true
    pkill -f "vite.*$FRONTEND_PORT" 2>/dev/null || true
    
    log_success "All services stopped"
}

# ===========================================
# HEALTH CHECK
# ===========================================
health_check() {
    echo ""
    echo -e "${CYAN}=== Service Health Check ===${NC}"
    echo ""
    
    # Backend
    echo -n "Backend (port $BACKEND_PORT): "
    if curl -s "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Healthy${NC}"
        curl -s "http://localhost:$BACKEND_PORT/health" | python3 -m json.tool 2>/dev/null || true
    else
        echo -e "${RED}✗ Not responding${NC}"
    fi
    
    echo ""
    
    # Frontend
    echo -n "Frontend (port $FRONTEND_PORT): "
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$FRONTEND_PORT" | grep -q "200"; then
        echo -e "${GREEN}✓ Healthy${NC}"
    else
        echo -e "${RED}✗ Not responding${NC}"
    fi
    
    echo ""
    
    # Redis
    echo -n "Redis (port $REDIS_PORT): "
    if docker-compose exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
        echo -e "${GREEN}✓ Healthy${NC}"
    else
        echo -e "${RED}✗ Not responding${NC}"
    fi
    
    echo ""
    echo -e "${CYAN}=== Container Status ===${NC}"
    docker-compose ps 2>/dev/null || echo "No containers running"
}

# ===========================================
# LOGS
# ===========================================
show_logs() {
    docker-compose logs -f "$@"
}

# ===========================================
# MAIN
# ===========================================
case "${1:-}" in
    prod|start|up)
        start_prod
        ;;
    restart)
        restart_stack
        ;;
    dev)
        start_dev
        ;;
    stop|down)
        stop_all
        ;;
    health|status)
        health_check
        ;;
    logs)
        shift
        show_logs "$@"
        ;;
    *)
        echo ""
        echo -e "${CYAN}1v1bro Stack Manager${NC}"
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  prod, start, up  Start production stack (--no-cache build)"
        echo "  restart          Stop and restart with fresh build"
        echo "  dev              Start development mode (hot reload)"
        echo "  stop, down       Stop all services and clear ports"
        echo "  health, status   Check health of all services"
        echo "  logs [service]   Show logs (optionally for specific service)"
        echo ""
        echo "Ports:"
        echo "  Frontend: $FRONTEND_PORT"
        echo "  Backend:  $BACKEND_PORT"
        echo "  Redis:    $REDIS_PORT"
        echo ""
        exit 1
        ;;
esac
