resource "aws_dynamodb_table" "nexora" {
  name         = local.name_prefix
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = false
  }
}

resource "aws_s3_bucket" "web" {
  count         = var.enable_cdn ? 1 : 0
  bucket        = local.web_bucket
  force_destroy = var.environment == "lab"
}

resource "aws_s3_bucket_public_access_block" "web" {
  count  = var.enable_cdn ? 1 : 0
  bucket = aws_s3_bucket.web[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "web" {
  count  = var.enable_cdn ? 1 : 0
  bucket = aws_s3_bucket.web[0].id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_versioning" "web" {
  count  = var.enable_cdn ? 1 : 0
  bucket = aws_s3_bucket.web[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "web" {
  count  = var.enable_cdn ? 1 : 0
  bucket = aws_s3_bucket.web[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "web" {
  count      = var.enable_cdn ? 1 : 0
  bucket     = aws_s3_bucket.web[0].id
  depends_on = [aws_s3_bucket_versioning.web]

  rule {
    id     = "expire-old-builds"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}
