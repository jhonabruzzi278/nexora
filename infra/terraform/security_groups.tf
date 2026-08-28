resource "aws_security_group" "edge" {
  name                   = "nexora-${var.environment}-edge"
  description            = "Public HTTP and HTTPS entry point for Nexora"
  vpc_id                 = aws_vpc.nexora.id
  revoke_rules_on_delete = true

  ingress {
    description = "Public HTTP; redirect to HTTPS in a real deployment"
    protocol    = "tcp"
    from_port   = 80
    to_port     = 80
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Public HTTPS"
    protocol    = "tcp"
    from_port   = 443
    to_port     = 443
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Forward application traffic only to private subnet a"
    protocol    = "tcp"
    from_port   = 3000
    to_port     = 3000
    cidr_blocks = [var.private_subnets["a"].cidr_block]
  }

  egress {
    description = "Forward application traffic only to private subnet b"
    protocol    = "tcp"
    from_port   = 3000
    to_port     = 3000
    cidr_blocks = [var.private_subnets["b"].cidr_block]
  }

  tags = merge(local.common_tags, {
    Name = "nexora-${var.environment}-edge-sg"
    Tier = "edge"
  })
}

resource "aws_security_group" "application" {
  name                   = "nexora-${var.environment}-application"
  description            = "Private Nexora API reachable only from the edge tier"
  vpc_id                 = aws_vpc.nexora.id
  revoke_rules_on_delete = true

  ingress {
    description = "Accept API traffic only from public edge subnet a"
    protocol    = "tcp"
    from_port   = 3000
    to_port     = 3000
    cidr_blocks = [var.public_subnets["a"].cidr_block]
  }

  ingress {
    description = "Accept API traffic only from public edge subnet b"
    protocol    = "tcp"
    from_port   = 3000
    to_port     = 3000
    cidr_blocks = [var.public_subnets["b"].cidr_block]
  }

  egress {
    description = "Allow encrypted outbound calls to managed AWS endpoints"
    protocol    = "tcp"
    from_port   = 443
    to_port     = 443
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "nexora-${var.environment}-application-sg"
    Tier = "application"
  })
}
