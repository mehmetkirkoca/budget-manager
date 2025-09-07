.PHONY: help build up down restart logs clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build all Docker images
	docker-compose build --no-cache

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs for all services
	docker-compose logs -f

logs-api: ## Show API logs
	docker-compose logs -f api

logs-ui: ## Show UI logs
	docker-compose logs -f ui

logs-nginx: ## Show Nginx logs
	docker-compose logs -f nginx

logs-db: ## Show MongoDB logs
	docker-compose logs -f mongodb

status: ## Show service status
	docker-compose ps

clean: ## Remove containers, networks, images, and volumes
	docker-compose down -v
	docker system prune -f

dev: ## Start services in development mode
	docker-compose up --build

prod: ## Start services in production mode
	docker-compose -f docker-compose.yml up -d --build