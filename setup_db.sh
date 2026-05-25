#!/bin/bash
sudo -u postgres psql -c "CREATE DATABASE mindylu;"
sudo -u postgres psql -c "CREATE USER mindylu WITH PASSWORD 'db_MindyLu_2026!';"
sudo -u postgres psql -c "ALTER ROLE mindylu SET client_encoding TO 'utf8';"
sudo -u postgres psql -c "ALTER ROLE mindylu SET default_transaction_isolation TO 'read committed';"
sudo -u postgres psql -c "ALTER ROLE mindylu SET timezone TO 'UTC';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mindylu TO mindylu;"
sudo -u postgres psql -d mindylu -c "GRANT ALL ON SCHEMA public TO mindylu;"
