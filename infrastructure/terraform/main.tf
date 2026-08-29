terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
  }
}

provider "digitalocean" {
}

# VPC
resource "digitalocean_vpc" "main" {
  name     = "bookdianight-vpc"
  region   = var.region
  ip_range = var.vpc_cidr
}

# SSH Key
resource "digitalocean_ssh_key" "admin" {
  name       = "BookDiaNight-admin-key"
  public_key = var.admin_public_key
}

# Cloud Firewall
resource "digitalocean_firewall" "app_firewall" {
  name        = "bookdianight-app-firewall"
  droplet_ids = [digitalocean_droplet.app_server.id]

  # Inbound Rules
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = [var.admin_ssh_cidr]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  # Outbound Rules
  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

# Droplet
resource "digitalocean_droplet" "app_server" {
  image    = "ubuntu-24-04-x64"
  name     = "bookdianight-server"
  region   = var.region
  size     = "s-2vcpu-8gb-160gb-intel"
  vpc_uuid = digitalocean_vpc.main.id
  ssh_keys = [digitalocean_ssh_key.admin.id]

  # Assign to Firewall
  tags = ["bookdianight-server"]
}


# Reserved IP
resource "digitalocean_reserved_ip" "app_ip" {
  region = var.region
}

# Reserved IP Assignment
resource "digitalocean_reserved_ip_assignment" "app_ip_assignment" {
  ip_address = digitalocean_reserved_ip.app_ip.ip_address
  droplet_id = digitalocean_droplet.app_server.id
}

# Container Registry
resource "digitalocean_container_registry" "bookdianight" {
  name                   = "bookdianight-registry"
  subscription_tier_slug = "starter"
}

# Managed PostgreSQL
resource "digitalocean_database_cluster" "postgres" {
  name                 = "bookdianight-pg"
  engine               = "pg"
  version              = "16"
  size                 = "db-s-1vcpu-2gb"
  region               = var.region
  node_count           = 1
  private_network_uuid = digitalocean_vpc.main.id
}

# PostgreSQL Firewall
resource "digitalocean_database_firewall" "postgres_fw" {
  cluster_id = digitalocean_database_cluster.postgres.id

  rule {
    type  = "droplet"
    value = digitalocean_droplet.app_server.id
  }
}

# Managed Redis
resource "digitalocean_database_cluster" "redis" {
  name                 = "bookdianight-redis"
  engine               = "valkey"
  version              = "8"
  size                 = "db-s-1vcpu-2gb"
  region               = var.region
  node_count           = 1
  private_network_uuid = digitalocean_vpc.main.id
}

# Redis Firewall
resource "digitalocean_database_firewall" "redis_fw" {
  cluster_id = digitalocean_database_cluster.redis.id

  rule {
    type  = "droplet"
    value = digitalocean_droplet.app_server.id
  }
}

# DigitalOcean Spaces Bucket
resource "digitalocean_spaces_bucket" "storage" {
  name   = "bookdianight-storage"
  region = var.region
  acl    = "public-read"
}

# CORS Configuration
resource "digitalocean_spaces_bucket_cors_configuration" "storage_cors" {
  bucket = digitalocean_spaces_bucket.storage.id
  region = digitalocean_spaces_bucket.storage.region

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}

# Spaces CDN
resource "digitalocean_cdn" "storage_cdn" {
  origin = digitalocean_spaces_bucket.storage.bucket_domain_name
}
