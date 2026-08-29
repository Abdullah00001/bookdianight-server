variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "fra1"
}

variable "vpc_cidr" {
  description = "CIDR block for the DigitalOcean VPC"
  type        = string
  default     = "10.10.0.0/16"
}

variable "admin_ssh_cidr" {
  description = "The CIDR block allowed to SSH into the Droplet"
  type        = string
}

variable "admin_public_key" {
  description = "The public SSH key for the Droplet"
  type        = string
}
