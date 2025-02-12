
DOCKER_COMPOSE = docker compose
up:
	$(DOCKER_COMPOSE) up
down:
	$(DOCKER_COMPOSE) down

migrate:
	$(DOCKER_COMPOSE) exec accounts_service python manage.py migrate && $(DOCKER_COMPOSE) exec game_service python manage.py migrate

makemigrations:
	$(DOCKER_COMPOSE) exec accounts_service python manage.py makemigrations accounts


fclean :
	docker system prune -af 
createsuperuser:
	$(DOCKER_COMPOSE) exec web python manage.py createsuperuser


install:
	pip install -r requirements.txt


collectstatic:
	$(DOCKER_COMPOSE) exec accounts_service python manage.py collectstatic --noinput


shell:
	$(DOCKER_COMPOSE) exec accounts_service bash
restart:
	docker compose restart

logs:
	$(DOCKER_COMPOSE) logs -f

re : down fclean up
	

.PHONY: up down migrate createsuperuser install runserver collectstatic shell logs
