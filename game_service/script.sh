#!/bin/sh

set -e

python manage.py makemigrations game

exec "$@"