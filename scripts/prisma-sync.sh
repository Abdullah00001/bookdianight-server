#!/bin/bash

echo "Syncing generated Prisma client to running Docker services..."

# Sync scheduler container
echo "Syncing bookdianight-scheduler..."
docker exec bookdianight-scheduler npx prisma generate

# Sync worker container
echo "Syncing bookdianight-worker..."
docker exec bookdianight-worker npx prisma generate

echo "Prisma sync complete!"
