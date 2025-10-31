# Stripe Analytics Backend

Backend API for Stripe analytics dashboard with webhook persistence to S3 via Kinesis Firehose.

## Features

- **Stripe Webhook Handler**: Receives webhooks from Stripe with signature verification
- **Kinesis Firehose Integration**: Persists webhooks to S3 as gzipped JSON
- **Durable Storage**: Only acknowledges webhooks after successful write to Firehose
- **Partitioned Data**: Stores webhooks in date-partitioned S3 structure for efficient querying

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your values
```

Required environment variables:
- `STRIPE_WEBHOOK_SECRET` - Get from Stripe Dashboard → Webhooks
- `AWS_REGION` - AWS region for Firehose (e.g., us-east-1)
- `FIREHOSE_DELIVERY_STREAM_NAME` - Name of your Firehose delivery stream
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` - AWS credentials (or use IAM role)

### 3. Set Up AWS Infrastructure

Follow the setup guide in `docs/FIREHOSE_SETUP.md` to create your Firehose delivery stream.

**Quick setup with CloudFormation:**
```bash
aws cloudformation create-stack \
  --stack-name stripe-webhook-infrastructure \
  --template-body file://docs/firehose-cloudformation.yaml \
  --parameters ParameterKey=BucketName,ParameterValue=your-company-stripe-webhooks \
  --capabilities CAPABILITY_NAMED_IAM
```

**Or with Terraform:**
```bash
cd docs
terraform init
terraform apply
```

### 4. Run Development Server

```bash
npm run dev
```

Server will start on http://localhost:3001

### 5. Configure Stripe Webhook

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Add endpoint: `https://your-domain.com/webhook/stripe`
3. Select events to receive
4. Copy signing secret to your `.env` file

## API Endpoints

### Health Check
```
GET /health
```

### Stripe Webhook
```
POST /webhook/stripe
```

Receives Stripe webhooks, verifies signature, and persists to Firehose before acknowledging.

**Headers:**
- `stripe-signature` - Required for signature verification

**Response:**
- `200 OK` - Webhook received and persisted
- `400 Bad Request` - Invalid signature
- `500 Internal Server Error` - Firehose write failed (Stripe will retry)

## Development

### Commands

```bash
npm run dev     # Start development server with hot reload
npm run build   # Build for production
npm run start   # Start production server
npm run lint    # Run ESLint
npm run clean   # Clean build artifacts
```

### Project Structure

```
src/
├── index.ts              # Main application entry point
├── routes/
│   ├── counter.ts        # Example counter routes
│   └── stripe-webhook.ts # Stripe webhook handler
└── schemas/
    └── index.ts          # Zod validation schemas
```

## Documentation

- **[Firehose Setup Guide](docs/FIREHOSE_SETUP.md)** - Complete guide for setting up AWS infrastructure
- **[CloudFormation Template](docs/firehose-cloudformation.yaml)** - IaC for AWS setup
- **[Terraform Configuration](docs/firehose-terraform.tf)** - Alternative IaC with Terraform
- **[Athena Queries](docs/athena-table.sql)** - SQL queries for analyzing webhook data
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Deploy to various platforms

## Architecture

```
┌─────────┐      HTTPS       ┌──────────────┐
│ Stripe  │ ─────────────────>│ Your API     │
└─────────┘                   └──────────────┘
                                     │
                              Verify signature
                                     │
                                     ▼
                              ┌──────────────┐
                              │  Firehose    │
                              │  PutRecord   │
                              └──────────────┘
                                     │
                              Wait for ACK ✓
                                     │
                                     ▼
                              ┌──────────────┐
                              │   Firehose   │
                              │   (buffers)  │
                              └──────────────┘
                                     │
                              Every 5 min / 5 MB
                                     │
                                     ▼
                              ┌──────────────┐
                              │   S3 Bucket  │
                              │  (gzipped)   │
                              └──────────────┘
```

## Data Flow

1. **Stripe sends webhook** → Your API endpoint
2. **Signature verification** → Ensures authenticity
3. **Write to Firehose** → Durable AWS storage (50-200ms)
4. **Acknowledge to Stripe** → Only after successful write
5. **Firehose buffers** → Batches records (5 min or 5 MB)
6. **Write to S3** → Gzipped, partitioned by date

## Security

✓ **Webhook signature verification** - Prevents spoofing/tampering
✓ **HTTPS required** - Encrypted transport
✓ **IAM role authentication** - No hardcoded credentials in production
✓ **S3 encryption** - Data encrypted at rest
✓ **Private S3 bucket** - No public access

## Monitoring

### CloudWatch Metrics

Monitor in AWS Console → CloudWatch → Metrics → Firehose:

- `IncomingRecords` - Webhooks received
- `DeliveryToS3.Success` - Successful deliveries
- `DeliveryToS3.DataFreshness` - Delivery latency

### Application Logs

```bash
# Check for Firehose errors
grep "Failed to persist webhook" logs/app.log

# Check for signature failures
grep "signature verification failed" logs/app.log
```

### CloudWatch Alarms

Automatically created by CloudFormation/Terraform:
- Alert if data not delivered within 10 minutes
- Alert if delivery success rate < 95%

## Querying Webhook Data

Use AWS Athena to query your webhook data with SQL:

```sql
-- Count webhooks by type today
SELECT type, COUNT(*) as count
FROM stripe_webhooks
WHERE year = '2025' AND month = '10' AND day = '31'
GROUP BY type
ORDER BY count DESC;
```

See `docs/athena-table.sql` for more examples.

## Troubleshooting

**Signature verification failing:**
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Check you're using the raw request body (not parsed JSON)

**Webhooks not in S3:**
- Wait 5 minutes (default buffer interval)
- Check CloudWatch logs: `/aws/kinesisfirehose/stripe-webhooks`
- Verify Firehose IAM role has S3 permissions

**High latency:**
- Check AWS region matches Firehose region
- Monitor Firehose CloudWatch metrics
- Consider using SQS as buffer for high volume

## Cost Estimation

For **1 million webhooks/month** at 5 KB average:

- Firehose: $0.145/month
- S3 storage: $0.069/month
- S3 requests: $0.0003/month
- **Total: ~$0.21/month**

Extremely cost-effective for webhook archival!

## Support

- Issues: Open a GitHub issue
- Docs: See `docs/` directory
- AWS Setup: See `docs/FIREHOSE_SETUP.md`
