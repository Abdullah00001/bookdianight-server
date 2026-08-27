variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_1a_cidr" {
  description = "CIDR block for the public subnet in eu-south-1a"
  type        = string
  default     = "10.0.1.0/24"
}

variable "public_subnet_1b_cidr" {
  description = "CIDR block for the public subnet in eu-south-1b"
  type        = string
  default     = "10.0.2.0/24"
}

variable "private_subnet_1a_cidr" {
  description = "CIDR block for the private subnet in eu-south-1a"
  type        = string
  default     = "10.0.11.0/24"
}

variable "private_subnet_1b_cidr" {
  description = "CIDR block for the private subnet in eu-south-1b"
  type        = string
  default     = "10.0.12.0/24"
}

variable "admin_ssh_cidr" {
  description = "The CIDR block allowed to SSH into the EC2 instance"
  type        = string
}

variable "admin_public_key" {
  description = "The public SSH key for the EC2 instance"
  type        = string
}
