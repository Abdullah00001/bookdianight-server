#!/bin/bash

echo "Syncing generated Prisma client to running Docker services..."

# Sync scheduler container
echo "Syncing bookdianight-scheduler..."
docker exec bookdianight-scheduler npx prisma generate

# When you add more services, append them here. Example:
# docker exec bookdianight-server npx prisma generate

echo "Prisma sync complete!"
