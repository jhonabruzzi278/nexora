output "account_id" {
  description = "AWS account verified by Terraform."
  value       = data.aws_caller_identity.current.account_id
}

output "web_bucket_name" {
  description = "Private bucket where the Vue build is synchronized."
  value       = aws_s3_bucket.web.id
}

output "cloudfront_distribution_id" {
  description = "Distribution invalidated after each frontend deployment."
  value       = aws_cloudfront_distribution.web.id
}

output "application_url" {
  description = "Public HTTPS URL for Nexora."
  value       = "https://${aws_cloudfront_distribution.web.domain_name}"
}

output "api_health_url" {
  description = "Direct API health endpoint used after deployment."
  value       = "${aws_apigatewayv2_api.api.api_endpoint}/health"
}

output "lambda_role_arn" {
  description = "Runtime role; no AWS keys are injected into the function."
  value       = aws_iam_role.api.arn
}
