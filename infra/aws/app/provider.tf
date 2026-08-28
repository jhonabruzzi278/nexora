provider "aws" {
  region              = var.aws_region
  allowed_account_ids = [var.aws_account_id]

  default_tags {
    tags = {
      Project     = "Nexora"
      Environment = var.environment
      ManagedBy   = "Terraform"
      CostCenter  = "laboratory"
    }
  }
}

data "aws_caller_identity" "current" {}

locals {
  name_prefix = "nexora-${var.environment}"
  web_bucket  = "nexora-${var.aws_account_id}-${var.aws_region}-${var.environment}-web"
}
