terraform {
  required_version = ">= 1.10.0"

  # Descomentar si se usa bucket S3 remoto de bootstrap:
  # backend "s3" {
  #   use_lockfile = true
  #   encrypt      = true
  # }

  required_providers {
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.7"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}
