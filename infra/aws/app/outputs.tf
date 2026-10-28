output "account_id" {
  description = "AWS account verified by Terraform."
  value       = data.aws_caller_identity.current.account_id
}

output "web_bucket_name" {
  description = "Private bucket where the Vue build is synchronized."
  value       = var.enable_cdn ? aws_s3_bucket.web[0].id : "disabled-for-learner-lab"
}

output "cloudfront_distribution_id" {
  description = "Distribution invalidated after each frontend deployment (if CDN is enabled)."
  value       = var.enable_cdn ? aws_cloudfront_distribution.web[0].id : "disabled-for-learner-lab"
}

output "application_url" {
  description = "Public HTTPS URL for Nexora (CloudFront or direct API Gateway in Learner Lab)."
  value       = var.enable_cdn ? "https://${aws_cloudfront_distribution.web[0].domain_name}" : aws_apigatewayv2_api.api.api_endpoint
}

output "api_gateway_endpoint" {
  description = "Direct API Gateway HTTP API endpoint."
  value       = aws_apigatewayv2_api.api.api_endpoint
}

output "api_health_url" {
  description = "Direct API health endpoint used after deployment."
  value       = "${aws_apigatewayv2_api.api.api_endpoint}/health"
}

output "api_dashboard_url" {
  description = "Direct API dashboard endpoint."
  value       = "${aws_apigatewayv2_api.api.api_endpoint}/api/v1/dashboard"
}

output "lambda_role_arn" {
  description = "Runtime role; no AWS keys are injected into the function."
  value       = var.use_lab_role ? data.aws_iam_role.lab_role[0].arn : aws_iam_role.api[0].arn
}
