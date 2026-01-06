#!/bin/bash
set -e

echo "Waiting for MySQL at $DB_HOST:$DB_PORT..."
until nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done
echo "MySQL is up!"

echo "Fixing database issues before migrations..."
python fix_migrations.py || true

echo "Creating migrations for contact app..."
python manage.py makemigrations contact --noinput || true

echo "Applying migrations..."
python manage.py migrate --noinput || true

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn server..."
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000 \
    --workers 2 \
    --timeout 120 \
    --graceful-timeout 30 \
    --log-level info