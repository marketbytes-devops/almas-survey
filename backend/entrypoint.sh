#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

echo "Waiting for MySQL at $DB_HOST:$DB_PORT..."
until nc -z "$DB_HOST" "$DB_PORT"; do
  sleep 1
done
echo "MySQL is up!"

echo "Fixing database issues before migrations..."
python fix_migrations.py || echo "Migration fixes script not found or failed"

echo "Creating migrations for contact app if needed..."
python manage.py makemigrations contact --noinput || true

echo "Applying Django migrations..."
python manage.py migrate --noinput || {
    echo "Migration failed. Attempting recovery..."

    # First, fake all problematic authapp migrations
    echo "Faking authapp migrations to mark them as applied..."
    python manage.py migrate authapp 0007 --fake || true
    python manage.py migrate authapp 0008 --fake || true
    python manage.py migrate authapp 0009 --fake || true
    python manage.py migrate authapp 0010 --fake || true

    # Try to fake contact migrations if they fail
    echo "Attempting to apply contact migrations..."
    python manage.py migrate contact --fake || true

    # Now try to apply all remaining migrations
    echo "Attempting to apply remaining migrations..."
    python manage.py migrate --noinput || {
        echo "Still failing. Faking all authapp migrations and continuing..."
        python manage.py migrate authapp --fake
        python manage.py migrate contact --fake
        python manage.py migrate --noinput
    }
}

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn server..."
exec gunicorn backend.wsgi:application --bind 0.0.0.0:8000