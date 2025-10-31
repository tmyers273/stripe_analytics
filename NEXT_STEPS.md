# Next Steps: Stripe Webhook to S3 via Firehose

This document outlines the steps to complete the Stripe webhook persistence implementation.

## What Was Implemented

✅ **Backend Webhook Endpoint** (`packages/backend/src/routes/stripe-webhook.ts`)
- POST `/webhook/stripe` endpoint
- Stripe signature verification for security
- Direct write to Kinesis Firehose before acknowledging
- Returns 400 for invalid signatures, 500 for storage failures

✅ **AWS SDK Integration**
- Installed `@aws-sdk/client-firehose` and `stripe` packages
- Configured Firehose client with region support

✅ **Documentation**
- Complete Firehose setup guide
- CloudFormation and Terraform templates
- Athena SQL queries for data analysis
- Deployment guide for various platforms

## What You Need To Do Next

### 1. Set Up AWS Infrastructure

Choose one of these methods:

#### Option A: CloudFormation (Recommended - One Command)
```bash
aws cloudformation create-stack \
  --stack-name stripe-webhook-infrastructure \
  --template-body file://packages/backend/docs/firehose-cloudformation.yaml \
  --parameters ParameterKey=BucketName,ParameterValue=your-company-stripe-webhooks \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Wait for stack creation (5-10 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name stripe-webhook-infrastructure \
  --region us-east-1

# Get outputs
aws cloudformation describe-stacks \
  --stack-name stripe-webhook-infrastructure \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

#### Option B: Terraform
```bash
cd packages/backend/docs
terraform init
terraform apply \
  -var="bucket_name=your-company-stripe-webhooks" \
  -var="environment=production"
```

#### Option C: AWS Console
Follow the detailed step-by-step guide in:
📄 `packages/backend/docs/FIREHOSE_SETUP.md`

### 2. Configure Environment Variables

Create `.env` file in `packages/backend/`:

```bash
cd packages/backend
cp .env.example .env
```

Edit `.env` with your values:
```bash
PORT=3001

# Stripe - Get from: https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET=whsec_your_signing_secret_here

# AWS - Match what you created in Step 1
AWS_REGION=us-east-1
FIREHOSE_DELIVERY_STREAM_NAME=stripe-webhooks

# AWS Credentials (use IAM role in production)
# For local development only:
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### 3. Test Locally

```bash
cd packages/backend
npm install
npm run dev
```

Server should start on http://localhost:3001

Test the endpoint:
```bash
# Health check
curl http://localhost:3001/health

# Webhook endpoint (will fail signature verification without valid Stripe signature)
curl -X POST http://localhost:3001/webhook/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### 4. Set Up Stripe Webhook (Using Stripe CLI for Testing)

Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
# Download from: https://github.com/stripe/stripe-cli/releases/latest

# Login
stripe login
```

Forward webhooks to your local server:
```bash
stripe listen --forward-to http://localhost:3001/webhook/stripe
```

This will print a webhook signing secret (starts with `whsec_`).
Copy it to your `.env` file as `STRIPE_WEBHOOK_SECRET`.

In another terminal, trigger a test event:
```bash
stripe trigger charge.succeeded
```

Check your logs for successful processing.

### 5. Verify Data in S3

After 5 minutes (or when 5MB of data is buffered), check S3:

```bash
# List files
aws s3 ls s3://your-company-stripe-webhooks/webhooks/ --recursive

# Download and inspect a file
aws s3 cp s3://your-company-stripe-webhooks/webhooks/year=2025/month=10/day=31/[filename].gz - | gunzip

# Should see newline-delimited JSON like:
# {"timestamp":"2025-10-31T12:00:00.000Z","type":"charge.succeeded","id":"evt_123","data":{...}}
```

### 6. Deploy to Production

Choose your platform and follow the guide:
📄 `packages/backend/docs/DEPLOYMENT.md`

**Recommended options:**
- **AWS ECS Fargate** - Best for production, use IAM roles
- **Railway/Render** - Easiest for small projects
- **AWS Lambda** - Most cost-effective for low volume

### 7. Configure Production Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Enter URL: `https://your-production-domain.com/webhook/stripe`
4. Select events to receive (or "Select all events" for full archival)
5. Click **"Add endpoint"**
6. Click **"Reveal signing secret"** and copy to production `.env`

### 8. Set Up Monitoring

#### CloudWatch Alarms (Already created by CloudFormation/Terraform)
- Data freshness alarm (triggers if data not delivered within 10 minutes)
- Delivery failure alarm (triggers if success rate < 95%)

#### Add SNS Notifications (Optional)
```bash
# Create SNS topic
aws sns create-topic --name stripe-webhook-alerts

# Subscribe your email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:stripe-webhook-alerts \
  --protocol email \
  --notification-endpoint your-email@company.com

# Update CloudWatch alarms to notify this topic
aws cloudwatch put-metric-alarm \
  --alarm-name stripe-webhooks-data-freshness \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:stripe-webhook-alerts \
  # ... (rest of alarm configuration)
```

### 9. Set Up Athena for Querying (Optional but Recommended)

Follow the SQL in:
📄 `packages/backend/docs/athena-table.sql`

```bash
# 1. Open AWS Athena Console
# 2. Run the CREATE DATABASE query
# 3. Run the CREATE TABLE query (update bucket name)
# 4. Start querying!

# Example: Count webhooks by type today
SELECT type, COUNT(*) as count
FROM stripe_webhooks
WHERE year = '2025' AND month = '10' AND day = '31'
GROUP BY type
ORDER BY count DESC;
```

### 10. Set Up S3 Lifecycle Policies (Cost Optimization)

Already configured in CloudFormation/Terraform:
- Move to Glacier after 90 days (saves ~90% on storage costs)
- Delete after 7 years (adjust as needed for compliance)

To modify:
```bash
# View current lifecycle rules
aws s3api get-bucket-lifecycle-configuration \
  --bucket your-company-stripe-webhooks

# Or modify in S3 Console → Management → Lifecycle rules
```

## Architecture Overview

```
Stripe → Your API → Firehose → S3 (gzipped, partitioned)
          ↓
    Verify signature
          ↓
    Wait for Firehose ACK
          ↓
    Respond 200 OK
```

## Key Files Reference

- 📄 **Webhook Handler**: `packages/backend/src/routes/stripe-webhook.ts`
- 📄 **Setup Guide**: `packages/backend/docs/FIREHOSE_SETUP.md`
- 📄 **CloudFormation**: `packages/backend/docs/firehose-cloudformation.yaml`
- 📄 **Terraform**: `packages/backend/docs/firehose-terraform.tf`
- 📄 **Athena Queries**: `packages/backend/docs/athena-table.sql`
- 📄 **Deployment**: `packages/backend/docs/DEPLOYMENT.md`
- 📄 **Backend README**: `packages/backend/README.md`

## Estimated Costs

For **1 million webhooks/month** at 5 KB average:

| Service | Cost/Month |
|---------|-----------|
| Kinesis Firehose (5 GB) | $0.145 |
| S3 Storage (3 GB gzipped) | $0.069 |
| S3 Requests (~60 PUTs) | $0.0003 |
| **Total** | **~$0.21** |

Extremely cost-effective! 🎉

## Security Checklist

- [ ] `STRIPE_WEBHOOK_SECRET` configured (signature verification enabled)
- [ ] HTTPS enabled on production endpoint
- [ ] AWS credentials use IAM role (not access keys) in production
- [ ] S3 bucket encryption enabled
- [ ] S3 bucket blocks public access
- [ ] CloudWatch alarms configured
- [ ] Application logs don't contain sensitive data

## Troubleshooting

**Problem: Signature verification failing**
- Solution: Ensure `STRIPE_WEBHOOK_SECRET` matches the one in Stripe Dashboard for that specific endpoint

**Problem: Webhooks not appearing in S3**
- Solution: Wait 5 minutes (buffer interval) or send 5MB of data
- Check CloudWatch logs: `/aws/kinesisfirehose/stripe-webhooks`

**Problem: "Access Denied" when writing to Firehose**
- Solution: Verify IAM policy allows `firehose:PutRecord` for your delivery stream ARN

**Problem: High latency (>500ms)**
- Solution: Ensure AWS_REGION matches Firehose region in environment variables

## Questions?

- 📖 Full documentation in `packages/backend/docs/`
- 🔍 Check CloudWatch logs for errors
- 📊 Monitor CloudWatch metrics for Firehose delivery

## Future Enhancements (Optional)

1. **SQS Buffer** - Add SQS between API and Firehose for better error isolation
2. **Batching** - Implement request batching for high volume (>1000/sec)
3. **Data Transformation** - Add Lambda to filter/transform webhooks before S3
4. **Real-time Processing** - Add Lambda to process webhooks in real-time
5. **Dead Letter Queue** - Store failed webhooks for manual retry
6. **Metrics Dashboard** - Create Grafana/CloudWatch dashboard

---

**Status**: Ready for AWS infrastructure setup ✅
**Next Action**: Run CloudFormation/Terraform to create Firehose delivery stream
