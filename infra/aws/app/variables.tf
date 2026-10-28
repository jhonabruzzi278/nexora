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

variable "environment" {
  description = "Deployment environment."
  type        = string
  default     = "lab"

  validation {
    condition     = contains(["lab", "staging", "production"], var.environment)
    error_message = "environment must be lab, staging, or production."
  }
}

variable "alert_email" {
  description = "Email that receives budget and operational alerts."
  type        = string

  validation {
    condition     = can(regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", var.alert_email))
    error_message = "alert_email must be a valid email address."
  }
}

variable "budget_limit_usd" {
  description = "Monthly laboratory budget. Kept below the USD 50 credit ceiling."
  type        = number
  default     = 40

  validation {
    condition     = var.budget_limit_usd > 0 && var.budget_limit_usd <= 45
    error_message = "budget_limit_usd must be between 1 and 45."
  }
}

variable "lambda_reserved_concurrency" {
  description = "Hard concurrency ceiling that limits accidental Lambda cost growth."
  type        = number
  default     = 2

  validation {
    condition     = var.lambda_reserved_concurrency >= 1 && var.lambda_reserved_concurrency <= 5
    error_message = "lambda_reserved_concurrency must be between 1 and 5 for the lab."
  }
}

variable "use_lab_role" {
  description = "Set to true when deploying to AWS Academy Learner Lab to use pre-created LabRole instead of creating IAM roles."
  type        = bool
  default     = true
}

variable "lab_role_name" {
  description = "Name of the pre-created IAM role in AWS Academy Learner Lab."
  type        = string
  default     = "LabRole"
}

variable "enable_cdn" {
  description = "Set to false when running in AWS Academy Learner Lab where CloudFront is restricted."
  type        = bool
  default     = false
}

variable "enable_budget" {
  description = "Set to false when running in AWS Academy Learner Lab where budgets:ModifyBudget is restricted."
  type        = bool
  default     = false
}
