# Makefile for studzee-website

.PHONY: help up down build lint logs clean

help:
	@echo "Commands:"
	@echo "  up           : Start all services with Docker Compose."
	@echo "  down         : Stop all services with Docker Compose."
	@echo "  build        : Build the Next.js application locally."
	@echo "  lint         : Lint the source code locally."
	@echo "  logs         : Follow logs for the website container."
	@echo "  clean        : Stop and remove all containers, networks, and images."

up:
	@echo "Starting docker containers..."
	docker compose up --build -d

down:
	@echo "Stopping docker containers..."
	docker compose down

build:
	@echo "Building application..."
	npm run build

lint:
	@echo "Linting code..."
	npm run lint

logs:
	@echo "Following website logs..."
	docker compose logs -f

clean:
	@echo "Cleaning up docker resources..."
	docker compose down --rmi all -v
