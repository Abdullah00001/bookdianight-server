# BookdiaNight Server

Welcome to the **BookdiaNight Server** project! This repository contains the backend infrastructure for the BookdiaNight application. 

It is designed using a **multi-service architecture** powered by Docker, sharing a central PostgreSQL database and a Redis instance for caching and job queues.

## 🏗 Architecture & Tech Stack

- **Node.js & TypeScript** (executed via `tsx` for fast development)
- **Docker & Docker Compose** for local orchestration and containerization
- **PostgreSQL** as the primary relational database
- **Redis** for pub/sub, caching, and background job queues (via BullMQ)
- **Prisma ORM** for type-safe database access

### Shared Database Strategy
We utilize a single `prisma` schema at the root of the project. All microservices (e.g., `scheduler`) mount this directory as a volume to access the centralized database configuration. 

This ensures that any schema modifications are instantly recognized across the entire infrastructure, while each service maintains its own generated Prisma client.

## 🚀 Quick Start

If you are a new developer setting up the project for the first time, please refer to our comprehensive onboarding guide:

👉 **[Developer Workflow & Onboarding Guide](./docs/developer-workflow.md)**

👉 **[Production Deployment & CI/CD Guide](./docs/production-deployment.md)**

## 🛠 Useful Scripts

We have custom root-level scripts to seamlessly manage our Prisma schema across Docker containers:

- `npm run prisma:migrate`: Connects to the local database container and applies any schema changes.
- `npm run prisma:generate`: Generates the Prisma client for your local host machine.
- `npm run prisma:sync`: Execs into the running Docker containers and generates the Alpine-compatible Prisma client for each microservice.

> **Note:** Whenever you change `prisma/schema.prisma`, always run `npm run prisma:migrate` followed by `npm run prisma:sync`!

## 📦 Services Overview

- **`scheduler`**: A Node.js background service responsible for executing cron jobs, delayed tasks, and polling via `node-cron` and `BullMQ`.
- *(Add new services here as the project grows!)*
