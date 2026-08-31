# BookDiaNight Backend Documentation

Welcome to the BookDiaNight server documentation. This repository contains the Node.js microservice backend for the BookDiaNight platform, encompassing the core API, background workers, scheduled cron jobs, and all infrastructure-as-code required to deploy the system.

## 1. Documentation Index

The documentation is organized logically into the following domains:

- **[Architecture Overview](architecture.md)**: Details the system topology, HTTP request lifecycle, and network boundaries.
- **[Database & Prisma](database.md)**: Explains the PostgreSQL schema, Prisma ORM integration, and our immutable migration workflow.
- **[Services & Queues](services.md)**: Outlines the Redis/Valkey integration, BullMQ worker queues, scheduled jobs, Socket.IO, and external integrations (e.g., Firebase, AWS S3 / DO Spaces).
- **[Security & Authentication](security.md)**: Details the JWT authentication flow, role-based access control, firewall boundaries, and secret management.
- **[Infrastructure & Deployment](production-deployment.md)**: The definitive guide on CI/CD (GitHub Actions), Docker, Terraform, Ansible, Nginx, Rollbacks, and Disaster Recovery.
- **[Observability & Reliability](observability.md)**: Covers Docker native healthchecks, deep dependency monitoring, logging, and current system limitations.
- **[Developer Workflow](developer-workflow.md)**: The complete guide for onboarding, running the local Docker Compose stack, and utilizing our custom code-generation scripts.

---

## 2. Project Structure

The monorepo is structured to clearly separate services, shared libraries, and infrastructure configurations.

### Application Services
- `server/` - The primary Express.js API handling all synchronous HTTP and WebSocket traffic.
- `worker/` - A BullMQ consumer daemon responsible for processing asynchronous tasks (e.g., emails, push notifications, heavy processing) offloaded by the server.
- `scheduler/` - A dedicated chron-based Node.js service that enqueues recurring tasks at specific intervals.

### Shared & Root Configurations
- `prisma/` - The single source of truth for the PostgreSQL database schema (`schema.prisma`) and historical migrations. Shared across all Node.js services.
- `docker/` - Contains the foundational `docker-compose.yaml` used for both local development (with ephemeral DBs) and production orchestration.
- `docs/` - Comprehensive system documentation.
- `scripts/` - Custom shell and Node.js scripts used to generate boilerplate code (`npm run create:endpoint`, `npm run create:queue`, etc.) and synchronize the Prisma client across Docker containers.
- `.github/workflows/` - The GitHub Actions CI/CD pipelines defining the immutable build-and-deploy sequence.

### Infrastructure (IaC)
- `infrastructure/terraform/` - HashiCorp Configuration Language (HCL) defining the permanent DigitalOcean resources (VPC, Spaces, Container Registry, managed Databases, and the baseline Cloud Firewall).
- `infrastructure/ansible/` - Playbooks responsible for the initial configuration of the Ubuntu Droplet, installing Docker, hardening SSH, and setting up Nginx and Let's Encrypt.

### What should NOT be placed in the root directory
- Business logic or controllers. All application code belongs strictly within `server/`, `worker/`, or `scheduler/`.
- Hardcoded secrets or `.env` files must NEVER be committed to Git. Ensure `.env.example` is the only environment template tracked.

---

## 3. Development Handoff (Getting Started)

A developer joining the project should be able to answer the following immediately:

- **How do I run this locally?** Run `npm install` at the root, copy `.env.example` to `.env`, and run `docker compose up -d --build`. You do not need to install PostgreSQL or Redis on your host machine.
- **What dependencies do I need?** Only Docker, Docker Compose, and Node.js v22 (for running root helper scripts).
- **How do I configure .env?** Duplicate `.env.example`. Update the `SMTP_*` and `FIREBASE_*` variables with safe sandbox credentials, otherwise the worker container will crash on boot.
- **How do I run PostgreSQL / Valkey?** They run automatically in Docker when you start the stack locally. In production, they are Managed DigitalOcean Databases.
- **How do I run migrations?** Run `npm run prisma:migrate` from the root to push schema changes, followed immediately by `npm run prisma:sync` to compile the Alpine Linux Prisma binaries inside the running containers.
- **How do I start server / worker / scheduler?** They boot automatically with `docker compose up`. They feature hot-reloading in development.
- **How do I build Docker images?** CI/CD builds them automatically. To test locally, run `docker compose build`.
- **How do I deploy?** Merge your PR to `main`. Create and push a Git tag (e.g., `v1.0.15`). GitHub Actions handles the rest.
- **How do I rollback?** Update the GitHub Actions workflow or manually SSH into the VPS and change `IMAGE_TAG=v1.0.14` in the environment, then run `docker compose pull && docker compose up -d`.
- **Where are logs?** Run `docker compose logs -f server` (or `worker`, `scheduler`).
- **Where are health checks?** `http://localhost:5000/health` (local) or `https://api.bookdianight.com/health` (prod).
- **What must NEVER be changed manually?** Do not edit the production database schema manually. Always use Prisma migrations. Do not edit Nginx configuration directly on the server without updating Ansible. Do not manually open permanent SSH ports on the DO Cloud Firewall.
