# Worker Service

The `worker` service handles asynchronous background processing, executing intensive computational tasks, interacting with third-party APIs (like Firebase for push notifications), and sending emails.

> [!WARNING]
> **This is a highly Docker-heavy project.**
> Do not attempt to run this project or install local service dependencies on your host machine to run services natively. The environment is strictly containerized. Always follow the instructions below and run the project using Docker Compose.

> Docker-first note: this service should be started through the root Docker Compose setup so it can use the shared Redis and PostgreSQL containers correctly.

## Responsibilities

- Processing jobs offloaded by `BullMQ` queues.
- Heavy background computations to offload the main API servers.
- Third-party integrations (Firebase Push Notifications, emails).
- Redis and PostgreSQL access for job coordination.
- Graceful shutdown management for interrupted jobs.

## Scripts

From this folder, you can run:

```bash
npm run build
npm run test
npm run start
npm run dev
npm run format
npm run lint
```

### Script details

- `build`: creates a production build. *Note: enforces linting (skipped for TS 7 compatibility currently) and testing via `scripts/build.sh` before compiling.*
- `test`: runs the unit and integration tests.
- `start`: runs the compiled worker service.
- `dev`: starts the service in development mode with nodemon.
- `format`: formats the source code.
- `lint`: checks for lint issues.

## Development Notes

- The service is meant to stay running continuously to process incoming queues.
- It depends on **Redis** for the `BullMQ` queues and **PostgreSQL** for runtime state and record updates.
- It utilizes `dumb-init` in Docker to ensure graceful shutdown signals (SIGINT/SIGTERM) are properly caught so that active jobs aren't corrupted mid-process.

## Useful Commands

```bash
docker compose logs -f worker
docker compose restart worker
docker compose exec worker sh
```
