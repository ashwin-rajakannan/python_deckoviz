#!/bin/bash

# =================================================================
# ELINITY P1 - "SAFE-ZONE" HOSTINGER DEPLOYMENT SCRIPT (V2)
# =================================================================

# 1. Create a clean environment
echo "Setting up production environment..."
if [ -f "env.h" ]; then
    cp env.h .env
else
    echo "ERROR: env.h not found. Please ensure it exists."
    exit 1
fi

# 2. Define TOTALLY UNIQUE Ports to avoid your existing containers
# App: 8090 (To avoid 8082, 8085, 8080)
# DB: 5440 (To avoid 5435)
# Redis: 6390 (To avoid 6385)

echo "Generating Docker Compose with SAFE ports..."
cat <<EOF > docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:15
    container_name: elinity-db-final
    restart: always
    environment:
      POSTGRES_USER: elinity_user
      POSTGRES_PASSWORD: Deckoviz_prod_2026
      POSTGRES_DB: elinity_db
    ports:
      - "5440:5432"
    volumes:
      - elinity_safe_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: elinity-redis-final
    restart: always
    ports:
      - "6390:6379"

  elinity-app:
    build: .
    container_name: elinity-app-final
    restart: always
    ports:
      - "8090:8081"
    env_file: .env
    environment:
      - DB_URL=postgresql://elinity_user:Deckoviz_prod_2026@db:5432/elinity_db
      - REDIS_URL=redis://redis:6379/0
      - DB_HOST=db
      - REDIS_HOST=redis
      - DB_SSL_MODE=disable
    command: uvicorn main:app --host 0.0.0.0 --port 8081
    depends_on:
      - db
      - redis

volumes:
  elinity_safe_data:
EOF

# 3. Build and Launch (ignore old containers)
echo "Building and Launching Elinity P1 (Safe Mode)..."
sudo docker-compose up -d --build

# 4. Wait for Database to wake up
echo "Waiting 15 seconds for database initialization..."
sleep 15

# 5. Automate Database Wipe and Restore
echo "Wiping internal structure for a clean restore..."
sudo docker exec -i elinity-db-final psql -U elinity_user -d postgres -c "DROP DATABASE IF EXISTS elinity_db WITH (FORCE);"
sudo docker exec -i elinity-db-final psql -U elinity_user -d postgres -c "CREATE DATABASE elinity_db;"

echo "Restoring data from ELINITY_FINAL_BACKUP.sql..."
if [ -f "ELINITY_FINAL_BACKUP.sql" ]; then
    cat ELINITY_FINAL_BACKUP.sql | sudo docker exec -i elinity-db-final psql -U elinity_user -d elinity_db
    echo "Restore completed successfully!"
else
    echo "WARNING: ELINITY_FINAL_BACKUP.sql not found. Please upload it to this folder."
fi

echo "------------------------------------------------"
echo "Elinity P1 is LIVE on Hostinger (PORT 8090)!"
echo "DOCS: http://YOUR_HOSTINGER_IP:8090/docs"
echo "------------------------------------------------"
