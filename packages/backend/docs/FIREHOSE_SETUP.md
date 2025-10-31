# Kinesis Firehose Setup for Stripe Webhooks

This guide walks you through setting up AWS Kinesis Firehose to store Stripe webhooks in S3.

## Overview

**Flow:** Stripe → Your API → Kinesis Firehose → S3 (gzipped JSON)

**What Firehose Does:**
- Buffers incoming webhook data
- Batches records together
- Compresses with GZIP
- Writes to S3 automatically
- Retries failures for up to 24 hours

## Prerequisites

- AWS Account with appropriate permissions
- S3 bucket for storing webhooks
- AWS CLI configured (optional, for command-line setup)

## Option 1: AWS Console Setup (Easiest)

### Step 1: Create S3 Bucket

1. Go to **S3 Console**: https://s3.console.aws.amazon.com/
2. Click **"Create bucket"**
3. Configuration:
   - **Bucket name**: `your-company-stripe-webhooks`
   - **Region**: `us-east-1` (or your preferred region)
   - **Versioning**: Disabled (optional: enable for extra safety)
   - **Encryption**: Enable SSE-S3 (recommended)
4. Click **"Create bucket"**

### Step 2: Create Firehose Delivery Stream

1. Go to **Kinesis Console**: https://console.aws.amazon.com/kinesis/
2. Click **"Delivery streams"** → **"Create delivery stream"**

#### Source Settings
- **Source**: Direct PUT
- **Delivery stream name**: `stripe-webhooks`

#### Destination Settings
- **Destination**: Amazon S3
- **S3 bucket**: Select your bucket from Step 1
- **S3 bucket prefix**: `webhooks/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/`
  - This creates partitioned structure for easier querying
- **S3 error output prefix**: `errors/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/`

#### Buffer Settings (Important!)
- **Buffer size**: `5 MB` (Firehose writes when this is reached)
- **Buffer interval**: `300 seconds` (5 minutes - Firehose writes when this is reached)
- Whichever threshold is hit first triggers the write

#### Compression and Encryption
- **Compression**: GZIP ✓ (saves ~60% storage costs)
- **Encryption**: Disabled (S3 bucket encryption is sufficient)

#### Error Logging
- **Error logging**: Enabled
- **CloudWatch log group**: `/aws/kinesisfirehose/stripe-webhooks`
- **CloudWatch log stream**: `S3Delivery`

#### Permissions
- **IAM role**: Create new IAM role
  - Firehose will auto-create a role with permissions to:
    - Write to your S3 bucket
    - Write CloudWatch logs
    - Encrypt/decrypt if needed

### Step 3: Test the Setup

```bash
# Using AWS CLI to send a test record
aws firehose put-record \
  --delivery-stream-name stripe-webhooks \
  --record '{"Data":"eyJ0ZXN0IjogInRlc3QgZGF0YSJ9Cg=="}'

# Check S3 bucket after 5 minutes (or when 5MB is reached)
aws s3 ls s3://your-company-stripe-webhooks/webhooks/ --recursive
```

## Option 2: Infrastructure as Code

See the included CloudFormation or Terraform templates in this directory:
- `firehose-cloudformation.yaml` - CloudFormation template
- `firehose-terraform.tf` - Terraform configuration

## IAM Permissions for Your Application

Your application needs permission to write to Firehose. Create an IAM policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "firehose:PutRecord",
        "firehose:PutRecordBatch"
      ],
      "Resource": "arn:aws:firehose:us-east-1:YOUR_ACCOUNT_ID:deliverystream/stripe-webhooks"
    }
  ]
}
```

**Attach this policy to:**
- **EC2/ECS:** IAM role attached to your instance/task
- **Lambda:** IAM role attached to your function
- **Local development:** IAM user with access keys (use `aws configure`)

## Configuration

Update your `.env` file:

```bash
AWS_REGION=us-east-1
FIREHOSE_DELIVERY_STREAM_NAME=stripe-webhooks

# For production: Use IAM role (recommended)
# For local development: Use credentials
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## Data Format in S3

Files will be stored as:

```
s3://your-company-stripe-webhooks/
  webhooks/
    year=2025/
      month=10/
        day=31/
          stripe-webhooks-1-2025-10-31-12-00-00-abc123.gz
          stripe-webhooks-1-2025-10-31-12-05-00-def456.gz
```

Each `.gz` file contains newline-delimited JSON (NDJSON):

```json
{"timestamp":"2025-10-31T12:00:00.000Z","type":"charge.succeeded","id":"evt_123","data":{...}}
{"timestamp":"2025-10-31T12:00:01.000Z","type":"customer.created","id":"evt_456","data":{...}}
```

## Querying with AWS Athena (Optional)

You can query your webhook data using SQL:

1. **Create Athena database and table** (see `athena-table.sql`)
2. **Query example:**
   ```sql
   SELECT
     type,
     COUNT(*) as count,
     DATE(timestamp) as date
   FROM stripe_webhooks
   WHERE year = '2025' AND month = '10'
   GROUP BY type, DATE(timestamp)
   ORDER BY date DESC, count DESC;
   ```

## Monitoring

### CloudWatch Metrics (Automatic)

- `IncomingRecords` - Records received by Firehose
- `IncomingBytes` - Bytes received
- `DeliveryToS3.Success` - Successful S3 deliveries
- `DeliveryToS3.DataFreshness` - Age of oldest record in Firehose

### Set Up Alarms

```bash
# Alert if data is stuck (not being delivered)
aws cloudwatch put-metric-alarm \
  --alarm-name firehose-stripe-webhooks-data-freshness \
  --alarm-description "Alert if webhook data is not being delivered to S3" \
  --metric-name DeliveryToS3.DataFreshness \
  --namespace AWS/Firehose \
  --statistic Maximum \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 600 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=DeliveryStreamName,Value=stripe-webhooks
```

## Cost Estimation

**Example:** 1 million webhooks/month at 5 KB average

- Firehose ingestion: 5 GB × $0.029 = **$0.145/month**
- S3 storage (gzipped): 3 GB × $0.023 = **$0.069/month**
- S3 PUT requests: ~60 requests × $0.005/1000 = **$0.0003/month**
- **Total: ~$0.21/month**

## Troubleshooting

### Webhooks not appearing in S3?
- Wait 5 minutes (default buffer interval)
- Check CloudWatch logs: `/aws/kinesisfirehose/stripe-webhooks`
- Verify IAM permissions on Firehose execution role

### "Access Denied" errors in application?
- Check IAM policy allows `firehose:PutRecord`
- Verify delivery stream name matches environment variable
- Check AWS credentials are configured correctly

### High data freshness (data stuck)?
- Check Firehose CloudWatch metrics
- Verify S3 bucket permissions
- Check for errors in CloudWatch logs

## Security Best Practices

1. **Use IAM roles** instead of access keys in production
2. **Enable S3 bucket encryption** (SSE-S3 or SSE-KMS)
3. **Restrict S3 bucket access** to only Firehose and authorized users
4. **Enable S3 versioning** for important data
5. **Set up S3 lifecycle policies** to archive old data to Glacier
6. **Monitor with CloudWatch alarms** for delivery failures

## Next Steps

1. Set up Athena for querying (see `athena-table.sql`)
2. Configure S3 lifecycle policies for cost optimization
3. Set up CloudWatch alarms for monitoring
4. Consider adding data transformation (Lambda) if you need to filter/modify webhooks before storage
