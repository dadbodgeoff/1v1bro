# 1v1bro Makefile
# Professional CI/CD commands for development and deployment
# Ports: Frontend=5173, Backend=8000, Redis=6379

.PHONY: help dev prod build stop logs health test clean deploy restart up down

# Default target
.DEFAULT_GOAL := help

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
CYAN := \033[0;36m
NC := \033[0m

help: ## Show this help message
	@echo ""
	@echo "$(CYAN)╔════════════════════════════════════════╗$(NC)"
	@echo "$(CYAN)║         1v1bro Stack Commands          ║$(NC)"
	@echo "$(CYAN)╚════════════════════════════════════════╝$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(CYAN)Ports:$(NC) Frontend=5173, Backend=8000, Redis=6379"
	@echo ""

# ============================================
# Quick Start (most common commands)
# ============================================

up: prod ## Alias for prod - start production stack

down: stop ## Alias for stop - stop all services

restart: ## Restart with fresh no-cache build (clears ports)
	@chmod +x scripts/start.sh
	@./scripts/start.sh restart

# ============================================
# Development
# ============================================

dev: ## Start development environment with hot reload
	@chmod +x scripts/start.sh
	@./scripts/start.sh dev

install: ## Install all dependencies
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	cd backend && pip install -r requirements.txt -r requirements-dev.txt
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	cd frontend && npm ci
	@echo "$(GREEN)Dependencies installed!$(NC)"

# ============================================
# Production
# ============================================

prod: ## Start production Docker stack (--no-cache, clears ports)
	@chmod +x scripts/start.sh
	@./scripts/start.sh prod

stop: ## Stop all services and clear ports
	@chmod +x scripts/start.sh
	@./scripts/start.sh stop

logs: ## Show container logs (use: make logs SERVICE=backend)
	@if [ -n "$(SERVICE)" ]; then \
		docker-compose logs -f $(SERVICE); \
	else \
		docker-compose logs -f; \
	fi

health: ## Check health of all services
	@chmod +x scripts/start.sh
	@./scripts/start.sh health

# ============================================
# Testing
# ============================================

test: test-backend test-frontend ## Run all tests

test-backend: ## Run backend tests
	@echo "$(BLUE)Running backend tests...$(NC)"
	cd backend && python -m pytest tests/ -v --tb=short

test-frontend: ## Run frontend tests
	@echo "$(BLUE)Running frontend tests...$(NC)"
	cd frontend && npm test -- --run

test-unit: ## Run unit tests only
	cd backend && python -m pytest tests/unit/ -v

test-property: ## Run property-based tests
	cd backend && python -m pytest tests/property/ -v

test-integration: ## Run integration tests (requires running stack)
	cd backend && python -m pytest tests/integration/ -v

coverage: ## Run tests with coverage report
	cd backend && python -m pytest tests/ --cov=app --cov-report=html
	@echo "$(GREEN)Coverage report: backend/htmlcov/index.html$(NC)"

# ============================================
# Code Quality
# ============================================

lint: lint-backend lint-frontend ## Run all linters

lint-backend: ## Lint backend code
	cd backend && python -m ruff check app/

lint-frontend: ## Lint frontend code
	cd frontend && npm run lint

format: ## Format all code
	cd backend && python -m ruff format app/
	cd frontend && npm run lint -- --fix

typecheck: ## Run TypeScript type checking
	cd frontend && npx tsc --noEmit

# ============================================
# Database
# ============================================

migrate: ## Run database migrations (requires Supabase CLI)
	@echo "$(YELLOW)Run migrations via Supabase dashboard or CLI$(NC)"
	@echo "supabase db push"

# ============================================
# Deployment
# ============================================

deploy-build: ## Build for deployment
	@echo "$(BLUE)Building production images...$(NC)"
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
	@echo "$(GREEN)Build complete!$(NC)"

deploy-push: ## Push images to registry (set REGISTRY env var)
	@if [ -z "$(REGISTRY)" ]; then \
		echo "$(YELLOW)Set REGISTRY env var (e.g., gcr.io/project-id)$(NC)"; \
		exit 1; \
	fi
	docker tag 1v1bro-frontend:latest $(REGISTRY)/1v1bro-frontend:latest
	docker tag 1v1bro-backend:latest $(REGISTRY)/1v1bro-backend:latest
	docker push $(REGISTRY)/1v1bro-frontend:latest
	docker push $(REGISTRY)/1v1bro-backend:latest

# ============================================
# Cleanup
# ============================================

clean: ## Clean build artifacts and caches
	@echo "$(BLUE)Cleaning up...$(NC)"
	rm -rf frontend/dist frontend/node_modules/.cache
	rm -rf backend/__pycache__ backend/.pytest_cache backend/.coverage
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	@echo "$(GREEN)Cleanup complete!$(NC)"

clean-docker: ## Remove Docker containers, images, and volumes
	docker-compose down -v --rmi local
	docker system prune -f

# ============================================
# Quick Commands
# ============================================

up: prod ## Alias for prod
down: stop ## Alias for stop
ps: ## Show running containers
	docker-compose ps
