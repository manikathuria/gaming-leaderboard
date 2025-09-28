#!/bin/sh
set -e

echo "📦 Running Prisma migrations..."
npx prisma migrate deploy || npx prisma db push   # fallback if no migrations exist

echo "🚀 Starting NestJS app..."
exec "$@"