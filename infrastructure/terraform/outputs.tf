output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_1a_id" {
  description = "The ID of the public subnet in eu-south-1a"
  value       = aws_subnet.public_1a.id
}

output "public_subnet_1b_id" {
  description = "The ID of the public subnet in eu-south-1b"
  value       = aws_subnet.public_1b.id
}

output "private_subnet_1a_id" {
  description = "The ID of the private subnet in eu-south-1a"
  value       = aws_subnet.private_1a.id
}

output "private_subnet_1b_id" {
  description = "The ID of the private subnet in eu-south-1b"
  value       = aws_subnet.private_1b.id
}

output "ec2_sg_id" {
  description = "The ID of the EC2 security group"
  value       = aws_security_group.ec2.id
}

output "rds_sg_id" {
  description = "The ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "redis_sg_id" {
  description = "The ID of the Redis security group"
  value       = aws_security_group.redis.id
}

output "ec2_instance_id" {
  description = "The ID of the EC2 instance"
  value       = aws_instance.app_server.id
}

output "ec2_public_ip" {
  description = "The public Elastic IP address of the EC2 instance"
  value       = aws_eip.app_eip.public_ip
}
