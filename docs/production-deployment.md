# Production Deployment & CI/CD Guide

This document outlines the entire production infrastructure, CI/CD pipeline, and step-by-step instructions on how to set up the VPS, manage GitHub Secrets, and deploy new releases for the BookdiaNight server architecture.

## 1. Architecture Overview
We use an **Image-Centric Deployment Strategy**. 
- The VPS **does not** contain any source code.
- GitHub Actions automatically builds the Docker images and pushes them to Docker Hub.
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
     DOCKER_USERNAME=your_dockerhub_username
     POSTGRES_USER=postgres
     POSTGRES_PASSWORD=your_secure_password
     POSTGRES_DB=bookdianight
     REDIS_PASSWORD=your_secure_password
     # Prisma connection string matching the credentials above:
     DATABASE_URL=postgresql://postgres:your_secure_password@postgres:5432/bookdianight?schema=public
     ```

## 3. GitHub Secrets Configuration
In your GitHub repository, go to **Settings > Secrets and variables > Actions** and add the following **Repository Secrets**:

| Secret Name | Description | Example |
|---|---|---|
| `DOCKER_USERNAME` | Your Docker Hub username. | `johndoe` |
| `DOCKER_PASSWORD` | Your Docker Hub password or Access Token. | `dckr_pat_xxxxxxx` |
| `VPS_HOST` | The public IP address of your VPS. | `159.65.30.35` |
| `VPS_USERNAME` | The SSH user on your VPS. | `developer` |
| `VPS_SSH_KEY` | The raw contents of the private key you generated (`cat ~/.ssh/gh_deploy_key`). | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

## 4. How to Deploy Updates
The CI/CD pipeline is fully automated via GitHub Actions (`.github/workflows/deploy.yml`).

To deploy a new version to production, simply create a new Git tag that starts with `v` and push it:

1. Commit your changes locally.
2. Create an annotated tag:
   ```bash
   git tag -a v1.0.3 -m "Release version 1.0.3"
   ```
3. Push the tag to GitHub:
   ```bash
   git push origin main --tags
   ```

### What happens in the background?
1. **GitHub Action Triggers:** The workflow detects the new `v*` tag.
2. **Build Stage:** It checks out the code, logs into Docker Hub, and uses `scheduler/Dockerfile` to build a production-ready image.
3. **Push Stage:** The image is pushed to Docker Hub as `<username>/bookdianight-scheduler:latest` and `<username>/bookdianight-scheduler:v1.0.3`.
4. **Deploy Stage:** 
   - GitHub Actions connects to the VPS via SSH.
   - It runs `docker compose pull` to grab the fresh images.
   - It runs `docker compose up -d` to restart the stack.
   - The `migrator` service starts first, running Prisma migrations.
   - Once migrations succeed, the actual services (like `scheduler`) start using the newly migrated schema.
