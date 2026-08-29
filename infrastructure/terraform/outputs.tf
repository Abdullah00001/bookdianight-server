output "vpc_id" {
  description = "The ID of the DigitalOcean VPC"
  value       = digitalocean_vpc.main.id
}

output "ssh_key_id" {
  description = "The ID of the uploaded SSH key"
  value       = digitalocean_ssh_key.admin.id
}

output "firewall_id" {
  description = "The ID of the Cloud Firewall"
  value       = digitalocean_firewall.app_firewall.id
}
output "droplet_id" {
  description = "The ID of the Droplet"
  value       = digitalocean_droplet.app_server.id
}

output "spaces_bucket_name" {
  description = "The name of the DigitalOcean Spaces bucket"
  value       = digitalocean_spaces_bucket.storage.name
}

output "spaces_bucket_endpoint" {
  description = "The endpoint URL for the DigitalOcean Spaces bucket"
  value       = digitalocean_spaces_bucket.storage.endpoint
}

output "spaces_bucket_fqdn" {
  description = "The fully qualified domain name of the bucket"
  value       = digitalocean_spaces_bucket.storage.bucket_domain_name
}

output "spaces_cdn_endpoint" {
  description = "The CDN endpoint for the Spaces bucket"
  value       = digitalocean_cdn.storage_cdn.endpoint
}

output "droplet_ipv4" {
  description = "The IPv4 address of the Droplet"
  value       = digitalocean_droplet.app_server.ipv4_address
}

output "reserved_ip" {
  description = "The reserved IP assigned to the Droplet"
  value       = digitalocean_reserved_ip.app_ip.ip_address
}

output "registry_endpoint" {
  description = "The endpoint of the Container Registry"
  value       = digitalocean_container_registry.bookdianight.server_url
}

output "postgres_private_uri" {
  description = "The private connection URI for the Managed PostgreSQL cluster"
  value       = digitalocean_database_cluster.postgres.private_uri
  sensitive   = true
}

output "redis_private_uri" {
  description = "The private connection URI for the Managed Redis cluster"
  value       = digitalocean_database_cluster.redis.private_uri
  sensitive   = true
}
