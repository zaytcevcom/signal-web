init: init-ci
init-ci: docker-down-clear \
	docker-pull docker-build docker-up

up: docker-up
down: docker-down
restart: down up


#Docker
docker-up:
	docker compose up -d

docker-down:
	docker compose down --remove-orphans

docker-down-clear:
	docker compose down -v --remove-orphans

docker-pull:
	docker compose pull

docker-build:
	docker compose build --pull


#Dockerhub
dockerhub-build:
	docker build --platform=linux/amd64 -f ./docker/nginx/Dockerfile -t zaytcevcom/signal-web:1.0.0 .

dockerhub-push:
	docker push zaytcevcom/signal-web:1.0.0

rebuild: dockerhub-build dockerhub-push
