# Terraform configuration for Kinesis Firehose delivery stream for Stripe webhooks
#
# Usage:
#   terraform init
#   terraform plan
#   terraform apply

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "Name for the S3 bucket to store webhooks"
  type        = string
  default     = "stripe-webhooks-bucket"
}

variable "delivery_stream_name" {
  description = "Name for the Kinesis Firehose delivery stream"
  type        = string
  default     = "stripe-webhooks"
}

variable "buffer_size_mb" {
  description = "Buffer size in MB (1-128)"
  type        = number
  default     = 5
  validation {
    condition     = var.buffer_size_mb >= 1 && var.buffer_size_mb <= 128
    error_message = "Buffer size must be between 1 and 128 MB"
  }
}

variable "buffer_interval_seconds" {
  description = "Buffer interval in seconds (60-900)"
  type        = number
  default     = 300
  validation {
    condition     = var.buffer_interval_seconds >= 60 && var.buffer_interval_seconds <= 900
    error_message = "Buffer interval must be between 60 and 900 seconds"
  }
}

variable "environment" {
  description = "Environment name (e.g., production, staging, development)"
  type        = string
  default     = "production"
}

# S3 Bucket for webhook storage
resource "aws_s3_bucket" "webhook_bucket" {
  bucket = var.bucket_name

  tags = {
    Name        = var.bucket_name
    Purpose     = "StripeWebhookStorage"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# S3 Bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "webhook_bucket_encryption" {
  bucket = aws_s3_bucket.webhook_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket public access block
resource "aws_s3_bucket_public_access_block" "webhook_bucket_public_access" {
  bucket = aws_s3_bucket.webhook_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket lifecycle configuration
resource "aws_s3_bucket_lifecycle_configuration" "webhook_bucket_lifecycle" {
  bucket = aws_s3_bucket.webhook_bucket.id

  rule {
    id     = "archive-old-webhooks"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 2555 # 7 years - adjust as needed
    }
  }
}

# CloudWatch Log Group for Firehose
resource "aws_cloudwatch_log_group" "firehose_log_group" {
  name              = "/aws/kinesisfirehose/${var.delivery_stream_name}"
  retention_in_days = 30

  tags = {
    Name        = "${var.delivery_stream_name}-logs"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# CloudWatch Log Stream
resource "aws_cloudwatch_log_stream" "firehose_log_stream" {
  name           = "S3Delivery"
  log_group_name = aws_cloudwatch_log_group.firehose_log_group.name
}

# IAM Role for Firehose
resource "aws_iam_role" "firehose_role" {
  name = "${var.delivery_stream_name}-firehose-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "firehose.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name        = "${var.delivery_stream_name}-firehose-role"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# IAM Policy for Firehose
resource "aws_iam_role_policy" "firehose_policy" {
  name = "${var.delivery_stream_name}-firehose-policy"
  role = aws_iam_role.firehose_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:AbortMultipartUpload",
          "s3:GetBucketLocation",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:ListBucketMultipartUploads",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.webhook_bucket.arn,
          "${aws_s3_bucket.webhook_bucket.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:PutLogEvents",
          "logs:CreateLogStream"
        ]
        Resource = aws_cloudwatch_log_group.firehose_log_group.arn
      }
    ]
  })
}

# Kinesis Firehose Delivery Stream
resource "aws_kinesis_firehose_delivery_stream" "webhook_stream" {
  name        = var.delivery_stream_name
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn   = aws_iam_role.firehose_role.arn
    bucket_arn = aws_s3_bucket.webhook_bucket.arn

    # Partitioned prefix for efficient querying
    prefix              = "webhooks/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"
    error_output_prefix = "errors/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"

    buffering_size     = var.buffer_size_mb
    buffering_interval = var.buffer_interval_seconds
    compression_format = "GZIP"

    cloudwatch_logging_options {
      enabled         = true
      log_group_name  = aws_cloudwatch_log_group.firehose_log_group.name
      log_stream_name = aws_cloudwatch_log_stream.firehose_log_stream.name
    }
  }

  tags = {
    Name        = var.delivery_stream_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# IAM Policy for Application (to write to Firehose)
resource "aws_iam_policy" "application_firehose_policy" {
  name        = "${var.delivery_stream_name}-write-access"
  description = "Allows application to write records to Stripe webhooks Firehose stream"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "firehose:PutRecord",
          "firehose:PutRecordBatch"
        ]
        Resource = aws_kinesis_firehose_delivery_stream.webhook_stream.arn
      }
    ]
  })

  tags = {
    Name        = "${var.delivery_stream_name}-write-access"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# CloudWatch Alarm for Data Freshness
resource "aws_cloudwatch_metric_alarm" "data_freshness_alarm" {
  alarm_name          = "${var.delivery_stream_name}-data-freshness"
  alarm_description   = "Alert if webhook data is not being delivered to S3"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DeliveryToS3.DataFreshness"
  namespace           = "AWS/Firehose"
  period              = 300
  statistic           = "Maximum"
  threshold           = 600
  treat_missing_data  = "notBreaching"

  dimensions = {
    DeliveryStreamName = var.delivery_stream_name
  }

  tags = {
    Name        = "${var.delivery_stream_name}-data-freshness-alarm"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# CloudWatch Alarm for Delivery Failures
resource "aws_cloudwatch_metric_alarm" "delivery_failure_alarm" {
  alarm_name          = "${var.delivery_stream_name}-delivery-failures"
  alarm_description   = "Alert if Firehose fails to deliver to S3"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "DeliveryToS3.Success"
  namespace           = "AWS/Firehose"
  period              = 300
  statistic           = "Average"
  threshold           = 0.95
  treat_missing_data  = "notBreaching"

  dimensions = {
    DeliveryStreamName = var.delivery_stream_name
  }

  tags = {
    Name        = "${var.delivery_stream_name}-delivery-failures-alarm"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Outputs
output "bucket_name" {
  description = "S3 bucket name for webhook storage"
  value       = aws_s3_bucket.webhook_bucket.id
}

output "bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.webhook_bucket.arn
}

output "delivery_stream_name" {
  description = "Kinesis Firehose delivery stream name"
  value       = aws_kinesis_firehose_delivery_stream.webhook_stream.name
}

output "delivery_stream_arn" {
  description = "Kinesis Firehose delivery stream ARN"
  value       = aws_kinesis_firehose_delivery_stream.webhook_stream.arn
}

output "application_policy_arn" {
  description = "IAM policy ARN for application to write to Firehose"
  value       = aws_iam_policy.application_firehose_policy.arn
}

output "log_group_name" {
  description = "CloudWatch log group for Firehose logs"
  value       = aws_cloudwatch_log_group.firehose_log_group.name
}

output "firehose_role_arn" {
  description = "IAM role ARN for Firehose"
  value       = aws_iam_role.firehose_role.arn
}
