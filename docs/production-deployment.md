# Production Deployment & CI/CD Guide

This document outlines the entire production infrastructure, CI/CD pipeline, and step-by-step instructions on how to set up the VPS, manage GitHub Secrets, and deploy new releases for the BookdiaNight server architecture.

> [!WARNING]
> **This is a highly Docker-heavy project.**
> Do not attempt to run this project or install local service dependencies on your host machine to run services natively. The environment is strictly containerized. Always follow the instructions below and run the project using Docker Compose.
## 1. Architecture Overview
We use an **Image-Centric Deployment Strategy**. 
- The VPS **does not** contain any source code.
- GitHub Actions automatically builds the Docker images and pushes them to DigitalOcean Container Registry.
- The VPS only pulls the pre-built images and runs them using a production `docker-compose.yaml` file.
- **Database Migrations:** We utilize an "Init Container" pattern (Option B). A temporary migration container runs the `npx prisma migrate deploy` command before the main services start, ensuring the database schema is always up to date.

## 2. Setting Up the VPS

### 2.1 Generating an SSH Key for GitHub Actions
To allow GitHub Actions to SSH into your VPS securely, you need to generate a dedicated SSH key pair on your VPS (or locally, and copy it).

1. SSH into your VPS as your deployment user (e.g., `developer`):
   ```bash
   ssh developer@<your_vps_ip>
   ```
2. Generate a new SSH key pair without a passphrase:
   ```bash
   ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f ~/.ssh/gh_deploy_key -N ""
   ```
3. Add the public key to the `authorized_keys` file so the user can log in with it:
   ```bash
   cat ~/.ssh/gh_deploy_key.pub >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```
4. Output the private key to your terminal. **Copy the entire output** (including the `BEGIN` and `END` lines) to use as a GitHub Secret later.
   ```bash
   cat ~/.ssh/gh_deploy_key
   ```

### 2.2 Directory and Configuration Setup
You need to prepare the VPS directory where the deployment will run.

1. Create the project directory:
   ```bash
   mkdir -p /opt/bookdianight-server
   cd /opt/bookdianight-server
   ```
2. Copy the production Docker Compose file:
   - On your local PC, open `docker/docker-compose.yaml`.
   - On the VPS, create the file: `nano docker-compose.yaml`.
   - Paste the contents and save.
3. Create your production environment variables:
   - On the VPS, run: `nano .env`
   - Add the necessary variables. For example:
     ```env
     DOCKER_USERNAME=registry.digitalocean.com/bookdianight-registry
     POSTGRES_USER=postgres
     POSTGRES_PASSWORD=your_secure_password
     POSTGRES_DB=bookdianight
     REDIS_PASSWORD=your_secure_password
     # Prisma connection string matching the credentials above:
     DATABASE_URL=postgresql://postgres:your_secure_password@postgis:5432/bookdianight?schema=public
     ```

## 3. GitHub Secrets Configuration
In your GitHub repository, go to **Settings > Secrets and variables > Actions** and add the following **Repository Secrets**:

| Secret Name | Description | Example |
|---|---|---|
| `DIGITALOCEAN_ACCESS_TOKEN` | Your DigitalOcean API token for the runner to authenticate with doctl. | `dop_v1_xxxxxxx` |
| `DO_REGISTRY_TOKEN` | Your DigitalOcean Registry Token for the Droplet to pull images. | `dop_v1_xxxxxxx` |
| `DO_DROPLET_HOST` | The public IP address of your DigitalOcean Droplet. | `159.65.30.35` |
| `DO_DROPLET_USER` | The SSH user on your Droplet. | `root` or `developer` |
| `DO_SSH_PRIVATE_KEY` | The raw contents of the private key you generated (`cat ~/.ssh/gh_deploy_key`). | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

## 4. How to Deploy Updates
The CI/CD pipeline is fully automated via GitHub Actions (`.github/workflows/deploy.yml`).

To deploy a new version to production, you must merge your changes into `main` and push a new Git tag that starts with `v` (e.g., `v1.0.12`).

### Standard Deployment Workflow

If you are working on the `development` branch and are ready to deploy to production, follow these exact steps:

1. **Commit and Push your development work:**
   ```bash
   git add .
   git commit -m "feat: added new feature"
   git push origin development
   ```

2. **Switch to the main branch and merge:**
   ```bash
   git switch main
   git pull origin main
   git merge development
   ```

3. **Bump the version and create the tag:**
   Instead of manually tagging, use the built-in NPM command which automatically updates your `package.json` version and creates an annotated git tag simultaneously:
   ```bash
   npm version patch -m "chore: release %s"
   ```
   *(Note: You can replace `patch` with a specific version like `1.0.12` or `minor` / `major`)*

4. **Push the code and the tags to trigger the pipeline:**
   ```bash
   git push origin main --follow-tags
   ```

Once pushed, GitHub Actions will detect the new `v*` tag and instantly begin deploying the new version directly to your production VPS!

### What happens in the background?
1. **GitHub Action Triggers:** The workflow detects the new `v*` tag.
2. **Build Stage:** It checks out the code, logs into DigitalOcean Container Registry via `doctl`, and builds production-ready images for the `server`, `scheduler`, and `worker` components.
3. **Push Stage:** The images are pushed to DO Registry as `registry.digitalocean.com/bookdianight-registry/bookdianight-{service}:latest` and `...:v*`.
4. **Deploy Stage:** 
   - GitHub Actions connects to the VPS via SSH.
   - It runs `docker compose pull` to grab the fresh images for all services.
   - It runs `docker compose up -d` to restart the stack.
   - The `migrator` service starts first, running Prisma migrations.
   - Once migrations succeed, the actual services (`server`, `worker`, `scheduler`) start using the newly migrated schema.
