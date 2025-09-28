#!/bin/bash
set -e

echo "🚀 Stopping old containers..."
docker compose down -v

echo "🔨 Building and starting new containers with env vars..."
docker compose --env-file .env up --build
