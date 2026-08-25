# BookdiaNight Server

Welcome to the **BookdiaNight Server** project! This repository contains the backend infrastructure for the BookdiaNight application. 

It is designed using a **multi-service architecture** powered by Docker, sharing a central PostGIS database (PostgreSQL with geospatial extensions) and a Redis instance for caching and job queues.

> [!WARNING]
> **This is a highly Docker-centric project.**
> Do not attempt to run this project or its services directly on your local host using local dependencies. You must **always** use Docker Compose to run this project. Please strictly follow the instructions to set up your environment.
## 🏗 Architecture & Tech Stack

- **Node.js & TypeScript** (executed via `tsx` for fast development)
- **Docker & Docker Compose** for local orchestration and containerization
- **PostGIS** as the primary relational database (requires the `postgis/postgis` Docker image)
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

### Database & Prisma
We have custom root-level scripts to seamlessly manage our Prisma schema across Docker containers:

- `npm run prisma:migrate`: Connects to the local database container and applies any schema changes.
- `npm run prisma:generate`: Generates the Prisma client for your local host machine.
- `npm run prisma:sync`: Execs into the running Docker containers and generates the Alpine-compatible Prisma client for each microservice.

> **Note:** Whenever you change `prisma/schema.prisma`, always run `npm run prisma:migrate` followed by `npm run prisma:sync`!

### Code Generators
We utilize automated generation scripts to eliminate boilerplate and enforce strict typing:

**Background Workers & Schedulers:**
- `npm run create:job <job_name>`: Scaffolds a new scheduled cron job in the `scheduler` service.
- `npm run create:queue <queue_name>`: Scaffolds a complete dynamic queue module inside the `worker` service, and automatically mirrors the queue definitions to the `server` and `scheduler` so they can instantly produce jobs!
- `npm run create:queue-job <queue_name> <job_name>`: Generates a perfectly typed job handler for an existing queue in the `worker` service.
- `npm run create:emailTemp <template_name>`: Interactively scaffolds a new email template string export in the `worker/src/app/templates/` directory.

**Server API Automation:**
- `npm run create:module <module_name>`: Scaffolds a full 8-file API module in `server` and interactively auto-registers its routes into your desired API version.
- `npm run create:endpoint`: Interactively generates a complete controller, service, and auto-registers the route on a specific module.
- `npm run create:version <version_name>`: Initializes a completely new API version (e.g. `v2`), mapping it globally across your `const.ts`, `app.ts`, and `routes/v2/index.ts`.
- `npm run add:route <module_names>`: Batch registers existing API modules into a specific API version interactively.
- `npm run remove:route <module_names>`: Batch unregisters existing API modules from a specific API version.

## 📦 Services Overview

- **`server`**: A Node.js Express API service serving as the primary backend for the BookdiaNight application.
- **`scheduler`**: A Node.js background service responsible for executing cron jobs, delayed tasks, and polling via `node-cron` and `BullMQ`.
- **`worker`**: A Node.js service dedicated to processing background jobs from `BullMQ`, executing heavy computations, sending Firebase push notifications, and performing email tasks.
