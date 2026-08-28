output "table_name" {
  description = "DynamoDB table consumed by the Nexora API."
  value       = aws_dynamodb_table.nexora.name
}

output "table_arn" {
  description = "DynamoDB table ARN used by the future least-privilege IAM policy."
  value       = aws_dynamodb_table.nexora.arn
}

output "vpc_id" {
  description = "Secure VPC created for the Nexora workload."
  value       = aws_vpc.nexora.id
}

output "public_subnet_ids" {
  description = "Public edge subnet IDs by availability-zone key."
  value       = { for key, subnet in aws_subnet.public : key => subnet.id }
}

output "private_subnet_ids" {
  description = "Private application subnet IDs by availability-zone key."
  value       = { for key, subnet in aws_subnet.private : key => subnet.id }
}

output "edge_security_group_id" {
  description = "Security group for the future public load balancer or edge component."
  value       = aws_security_group.edge.id
}

output "application_security_group_id" {
  description = "Security group for the future private API runtime."
  value       = aws_security_group.application.id
}
