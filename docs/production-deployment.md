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
     # Prisma connection string pointing to the DigitalOcean Managed PostgreSQL cluster:
     DATABASE_URL="postgresql://doadmin:your_secure_password@private-your-cluster.db.ondigitalocean.com:25060/bookdianight?sslmode=require"
     ```

## 3. GitHub Secrets Configuration
In your GitHub repository, go to **Settings > Secrets and variables > Actions** and add the following **Repository Secrets**:

| Secret Name | Description | Example |
|---|---|---|
| `DIGITALOCEAN_ACCESS_TOKEN` | Your DigitalOcean API token for the runner to authenticate with doctl (used for both Registry login and Firewall rules). | `dop_v1_xxxxxxx` |
| `DO_REGISTRY_TOKEN` | Your DigitalOcean Registry Token for the Droplet to pull images. | `dop_v1_xxxxxxx` |
| `DO_SSH_PRIVATE_KEY` | The raw contents of the private key you generated (`cat ~/.ssh/gh_deploy_key`). | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

Additionally, add the following **Repository Variables**:

| Variable Name | Description | Example |
|---|---|---|
| `DO_DROPLET_HOST` | The public IP address of your DigitalOcean Droplet. | `159.65.30.35` |
| `DO_DROPLET_USER` | The SSH user on your Droplet. | `developer` |
| `DO_ACCOUNT_EMAIL` | Email for DOCR authentication. | `you@domain.com` |

## 4. Architecture & Security

### 4.1 Immutable Image Tags & Rollbacks
Production deployments no longer use the `:latest` tag. Instead, GitHub Actions injects the precise Git release tag (e.g., `v1.0.13`) into the deployment environment as `IMAGE_TAG`.
- **Release Relationship**: When you push Git tag `v1.0.13`, the pipeline builds and tags the Docker images as `v1.0.13` and deploys that exact immutable tag.
- **Rollback Procedure**: If a deployment fails, you can roll back instantly without waiting for a rebuild. Simply run GitHub Actions again for an older tag (e.g., `v1.0.12`), or manually execute `IMAGE_TAG=v1.0.12 docker compose up -d` on the Droplet.
- **Database Rollbacks**: **IMPORTANT**: Database migrations (Prisma) are strictly forward-only. Rolling back the application image to `v1.0.12` does NOT roll back the database schema. If `v1.0.13` altered the schema, you must ensure your older application code can safely interface with the newer schema.

### 4.2 Firewall Automation
To protect the SSH daemon from brute-force attacks, the DigitalOcean Cloud Firewall globally drops Port 22 connections by default.
During a CI deployment, the following ephemeral firewall automation occurs:
1. **Permanent vs Ephemeral**: Terraform manages the permanent firewall state (which allows only authorized static IPs).
2. **Temporary Authorization**: GitHub Actions discovers its dynamic runner IP and temporarily adds it to the Cloud Firewall via `doctl`.
3. **Deployment**: The runner executes SCP and SSH.
4. **Guaranteed Cleanup**: The workflow uses an `if: always()` cleanup step to strictly revoke the specific `/32` runner IP from the firewall, regardless of deployment success or failure.

## 5. How to Deploy Updates
The CI/CD pipeline is fully automated via GitHub Actions (`.github/workflows/deploy.yaml`).

To deploy a new version to production, push a new Git tag that starts with `v` (e.g., `v1.0.13`).

```bash
git add .
git commit -m "feat: added new feature"
git switch main
git merge development
npm version patch -m "chore: release %s"
git push origin main --follow-tags
```

Once pushed, GitHub Actions will detect the new tag, build the versioned images, whitelist itself in the firewall, pull the versioned images on the VPS, and execute the database migrations automatically.
