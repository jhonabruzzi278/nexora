variable "environment" {
  description = "Environment suffix used by Nexora resources."
  type        = string
  default     = "local"
}

variable "aws_region" {
  description = "AWS region used by Floci and future AWS deployments."
  type        = string
  default     = "us-east-1"
}

variable "aws_endpoint_url" {
  description = "AWS-compatible endpoint. Use Floci locally."
  type        = string
  default     = "http://localhost:4566"
}

variable "owner" {
  description = "Owner tag for cost and operational traceability."
  type        = string
  default     = "nexora-team"
}

variable "vpc_cidr" {
  description = "Private IPv4 range reserved for Nexora."
  type        = string
  default     = "10.20.0.0/16"

  validation {
    condition     = can(cidrnetmask(var.vpc_cidr))
    error_message = "vpc_cidr must be a valid IPv4 CIDR block."
  }
}

variable "public_subnets" {
  description = "Public edge subnets distributed across availability zones."
  type = map(object({
    availability_zone = string
    cidr_block        = string
  }))
  default = {
    a = {
      availability_zone = "us-east-1a"
      cidr_block        = "10.20.0.0/24"
    }
    b = {
      availability_zone = "us-east-1b"
      cidr_block        = "10.20.1.0/24"
    }
  }
}

variable "private_subnets" {
  description = "Private application subnets without a default internet route."
  type = map(object({
    availability_zone = string
    cidr_block        = string
  }))
  default = {
    a = {
      availability_zone = "us-east-1a"
      cidr_block        = "10.20.10.0/24"
    }
    b = {
      availability_zone = "us-east-1b"
      cidr_block        = "10.20.11.0/24"
    }
  }
}
