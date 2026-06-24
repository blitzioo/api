default_target: env

env:
	docker compose -f .docker/dev/docker-compose.yml up
.PHONY: env

build:
	docker build -t ${APP_NAME}:latest .
.PHONY: build