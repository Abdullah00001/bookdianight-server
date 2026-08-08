#!/bin/bash
# Fail immediately if any command exits with a non-zero status
set -e

echo "🔍 Running ESLint..."
npm run lint

echo "🧪 Running Tests..."
npm run test

echo "🏗️ Compiling TypeScript..."
npx tsc && npx tsc-alias

echo "✅ Build successful! 🎉"
