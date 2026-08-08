# Developer Workflow & Onboarding

Welcome to the BookdiaNight Server project! This document outlines how to get up and running with the codebase as a new developer.

## Architecture Overview

This project is a multi-service Node.js architecture with a single shared database. Services (like `scheduler`) run in their own Docker containers. We use **Prisma** for our ORM. All shared definitions (like the Prisma schema) and orchestration scripts live at the **root** of the project.

> [!WARNING]
> **This is a highly Docker-heavy project.**
> Do not attempt to run this project or install local service dependencies on your host machine to run services natively. The environment is strictly containerized. Always follow the instructions below and run the project using Docker Compose.
---

## 1. Initial Setup (After Cloning)

Once you have cloned the repository to your local machine, follow these steps to set up your environment:

### Prerequisites
- [Docker & Docker Compose](https://docs.docker.com/get-docker/) installed.
- [Node.js](https://nodejs.org/en/) (v22 recommended) installed locally for running root scripts.

### Setup Steps
1. **Install Root Dependencies**
   Open a terminal at the root of the project and run:
   ```bash
   npm install
   ```
   *(This installs the Prisma CLI and other shared dependencies required to manage the database schema.)*

2. **Configure Environment Variables**
   Copy the example environment file to create your local configuration:
   ```bash
   cp .env.example .env
   ```
   *Note: Do not modify `.env.example` with personal credentials. The default values in `.env.example` are pre-configured to work perfectly with the local Docker containers.*

---

## 2. Starting the Project

We run all services, including our Postgres database and Redis, via Docker Compose.

1. **Build and Start the Stack**
   From the root directory, run:
   ```bash
   docker compose up -d --build
   ```
   *This command will download the necessary images, build the custom service images (e.g., the scheduler), and start them in the background (`-d`).*

2. **Verify Containers are Running**
   You can check the status of your containers using:
   ```bash
   docker compose ps
   ```
   *Ensure that `bookdianight-postgres`, `bookdianight-redis`, `bookdianight-scheduler`, and `bookdianight-worker` are marked as healthy/running.*

---

## 3. Database Management: Migrate & Sync

Because the database runs in a container but we author our schema on the host machine, we have a custom two-step workflow for Prisma:

### Step A: Migrate the Database
Whenever you first clone the project, or whenever you change the `prisma/schema.prisma` file, you need to push those changes to the database.

From the root directory, run:
```bash
npm run prisma:migrate
```
*What this does:* Connects to the local Postgres container (via port `5440`) and runs `npx prisma migrate dev`. It ensures your database schema is up-to-date and generates the Prisma client locally at the root.

### Step B: Sync the Containers
Our Node.js services run in Alpine Linux containers, which require a different Prisma query engine binary than your host machine (Mac/Windows/Ubuntu).

After migrating, **you must sync the changes to the running containers**:
```bash
npm run prisma:sync
```
*What this does:* This script securely execs into the running Docker containers (like `bookdianight-scheduler`) and runs `npx prisma generate` from *inside* the container, ensuring the container has the correct binary for Alpine Linux.

> [!IMPORTANT]
> **Always run both commands sequentially whenever the schema changes!**
> 1. `npm run prisma:migrate`
> 2. `npm run prisma:sync`

---

## 4. Development Workflow

Once the project is running and the database is synced, you are ready to develop!

- **Hot Reloading:** The services (like `scheduler` and `worker`) are configured with `nodemon` and `tsx`. Changes made to `scheduler/src/**/*.ts` or `worker/src/**/*.ts` will automatically trigger a reload inside the Docker container.
- **Viewing Logs:** To watch the live logs for a specific service:
  ```bash
  docker compose logs -f scheduler
  docker compose logs -f worker
  ```
- **Redis UI:** We have included a Redis UI in the docker-compose stack. You can access it in your browser at `http://localhost:8083` (Credentials: admin / admin).

### Adding a New Background Job (Scheduler)
If you need to add a new scheduled task to the scheduler service:
1. Run `npm run create:job <job-name>` from the root (e.g., `npm run create:job generate-reports`).
2. This will automatically generate a correctly-typed boilerplate in `scheduler/src/app/jobs/<job-name>/`.
3. Add your logic to the `.tasks.ts` file. The scheduler will automatically discover and register your job on startup!

### Adding a New Service
If you are tasked with adding a new microservice:
1. Create a new folder at the root (e.g., `./notifications`).
2. Add a `Dockerfile.dev` inside it (you can copy the one from `scheduler` as a template).
3. Add the service to `docker-compose.yaml`.
4. Ensure the service mounts the shared `prisma` directory as a volume (`- ./prisma:/app/prisma`).
5. Update `scripts/prisma-sync.sh` to include a sync command for your new container!

---

## 5. Code Quality & CI Pipeline

To ensure the codebase remains clean and stable, we enforce strict code quality checks:

### Local Tooling
- **ESLint & Prettier:** The project is configured with strict linting (`eslint.config.mjs`) and formatting (`.prettierrc`) at the root.
- **Husky & Lint-Staged:** Whenever you attempt to `git commit`, Husky intercepts it and runs ESLint and Prettier *only on your staged files*. If there are syntax errors or linting violations, the commit will be blocked.

### Continuous Integration (CI)
We have a two-step GitHub Actions pipeline:
1. **CI Pipeline (`ci.yaml`):** Runs automatically on every push or PR to `main`. It installs dependencies, lints the code, runs tests, and compiles the TypeScript using the strict `scripts/build.sh` script.
2. **Delivery Pipeline (`deploy.yaml`):** Runs *only* when a new Git tag (e.g., `v1.0.0`) is published. It builds the Docker images and pushes them to Docker Hub.

---

## 6. Git Workflow & Commits

To maintain a clean and understandable history, this repository follows strict standard practices for branching and committing.

### Branching Strategy
- **Never push directly to `main`.**
- For any new feature, bug fix, or chore, **create a new branch** from `main`.
  - Use descriptive branch names: `feature/add-login`, `bugfix/fix-cron-timezone`, `chore/update-deps`.
- When your work is complete, open a **Pull Request (PR)** against `main`.
- Follow standard PR practices: leave descriptive comments explaining your changes, and request a review before merging.

### Conventional Commits
We strictly adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification. This helps us automatically generate changelogs and understand the project history at a glance.

**Format:**
```
<type>(<optional scope>): <description>
```

**Common Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `chore`: Routine tasks, maintenance, or dependency updates (no production code changes)
- `docs`: Documentation only changes
- `refactor`: A code change that neither fixes a bug nor adds a feature

**Examples:**
- `feat(scheduler): add email notification job`
- `fix(auth): resolve token expiration issue`
- `chore(deps): update prisma to version 6`
- `docs(readme): add instructions for new service`

Always use the imperative mood in your commit message descriptions (e.g., "change message" instead of "changed message").
