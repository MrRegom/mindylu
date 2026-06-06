#!/bin/bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'mindylu_db_pass_2026';"
sudo -u postgres psql -c "CREATE DATABASE mindylu_db;" || true
sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgres://postgres:mindylu_db_pass_2026@127.0.0.1:5432/mindylu_db|g' /var/www/mindylu/backend/.env
cd /var/www/mindylu/backend
source venv/bin/activate
export DJANGO_SETTINGS_MODULE=config.settings.prod
python manage.py migrate
python full_seed.py
systemctl restart gunicorn
