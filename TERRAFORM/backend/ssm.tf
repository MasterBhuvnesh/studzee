# SSM Parameters for sensitive environment variables
# NOTE: These are created with placeholder values. 
# Update them manually in AWS Console or via AWS CLI after terraform apply.

locals {
  # Secrets that should be stored in SSM Parameter Store
  secrets = {
    "CLERK_PUBLISHABLE_KEY"  = "placeholder"
    "CLERK_SECRET_KEY"       = "placeholder"
    "MONGO_URI"              = "placeholder"
    "REDIS_URL"              = "placeholder"
    "AWS_ACCESS_KEY_ID"      = "placeholder"
    "AWS_SECRET_ACCESS_KEY"  = "placeholder"
  }

  # Non-sensitive environment variables (can be plain text)
  environment = {
    "PORT"                = "3000"
    "NODE_ENV"            = "production"
    "LIST_CACHE_TTL"      = "300"
    "DOC_CACHE_TTL"       = "86400"
    "JOB_CRON"            = "0 0 * * *"
    "LOG_LEVEL"           = "info"
    "AWS_REGION"          = var.aws_region
    "AWS_S3_BUCKET_NAME"  = "studzee-assets"
    "AWS_S3_BUCKET_URL"   = "https://studzee-assets.s3.ap-south-1.amazonaws.com"
  }
}

# Create SSM Parameters for secrets
resource "aws_ssm_parameter" "secrets" {
  for_each = local.secrets

  name        = "/${var.app_name}/${each.key}"
  description = "Secret for ${each.key}"
  type        = "SecureString"
  value       = each.value

  lifecycle {
    ignore_changes = [value]
  }

  tags = {
    Name        = "${var.app_name}-${each.key}"
    Environment = "production"
  }
}
