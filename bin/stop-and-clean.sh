#!/bin/bash
set -e

echo "🛑 Stopping all running containers..."
docker compose down -v --remove-orphans

echo "🧹 Removing dangling Docker images..."
docker image prune -f

echo "🧹 Removing dangling Docker volumes..."
docker volume prune -f

echo "✅ All containers, volumes, and unused images removed. Fresh start ready!"
