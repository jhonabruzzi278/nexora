variable "aws_region" {
  description = "AWS region for the Nexora laboratory."
  type        = string
  default     = "us-east-1"
}

variable "aws_account_id" {
  description = "Expected laboratory account ID. Prevents deploying to the wrong account."
  type        = string

  validation {
    condition     = can(regex("^[0-9]{12}$", var.aws_account_id))
    error_message = "aws_account_id must contain exactly 12 digits."
  }
}
