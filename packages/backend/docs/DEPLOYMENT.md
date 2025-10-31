# Deployment Guide for Stripe Webhook Handler

Quick reference for deploying the Stripe webhook handler to various platforms.

## Prerequisites

1. **AWS Infrastructure Setup**
   - Follow `FIREHOSE_SETUP.md` to create Firehose delivery stream
   - Note the delivery stream name for environment variables

2. **Stripe Configuration**
   - Create webhook endpoint in Stripe Dashboard
   - Copy the webhook signing secret (starts with `whsec_`)

3. **Environment Variables**
   ```bash
   PORT=3001
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   AWS_REGION=us-east-1
   FIREHOSE_DELIVERY_STREAM_NAME=stripe-webhooks
   ```

## Deployment Options

### Option 1: AWS ECS Fargate (Recommended)

**Pros:** Fully managed, auto-scaling, secure IAM roles

```bash
# 1. Build Docker image
docker build -t stripe-webhook-handler:latest .

# 2. Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker tag stripe-webhook-handler:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/stripe-webhook-handler:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/stripe-webhook-handler:latest

# 3. Create ECS task definition with IAM role that includes Firehose write policy
# 4. Create ECS service with ALB
# 5. Configure ALB with SSL certificate
```

**IAM Role:** Attach the policy created by CloudFormation/Terraform (`stripe-webhooks-write-access`)

### Option 2: AWS Lambda + API Gateway

**Pros:** Serverless, pay-per-request, auto-scales

```bash
# 1. Install dependencies
cd packages/backend
npm install

# 2. Build
npm run build

# 3. Package for Lambda
zip -r lambda.zip dist node_modules

# 4. Deploy
aws lambda create-function \
  --function-name stripe-webhook-handler \
  --runtime nodejs20.x \
  --handler dist/index.handler \
  --zip-file fileb://lambda.zip \
  --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-firehose-role \
  --environment Variables="{STRIPE_WEBHOOK_SECRET=whsec_...,FIREHOSE_DELIVERY_STREAM_NAME=stripe-webhooks,AWS_REGION=us-east-1}" \
  --timeout 30 \
  --memory-size 256

# 5. Create API Gateway with POST /webhook/stripe route
```

**Note:** You'll need to adapt the Hono app for Lambda handler format.

### Option 3: Railway / Render / Fly.io

**Pros:** Simple, automatic deployments, free tier available

**Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Set environment variables
railway variables set STRIPE_WEBHOOK_SECRET=whsec_...
railway variables set AWS_REGION=us-east-1
railway variables set FIREHOSE_DELIVERY_STREAM_NAME=stripe-webhooks
railway variables set AWS_ACCESS_KEY_ID=your_key
railway variables set AWS_SECRET_ACCESS_KEY=your_secret

# Deploy
railway up
```

**Render:**
- Connect GitHub repo
- Set environment variables in dashboard
- Auto-deploys on push

**Fly.io:**
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Launch app
fly launch

# Set secrets
fly secrets set STRIPE_WEBHOOK_SECRET=whsec_...
fly secrets set AWS_REGION=us-east-1
fly secrets set FIREHOSE_DELIVERY_STREAM_NAME=stripe-webhooks
fly secrets set AWS_ACCESS_KEY_ID=your_key
fly secrets set AWS_SECRET_ACCESS_KEY=your_secret

# Deploy
fly deploy
```

### Option 4: Traditional Server (EC2, DigitalOcean, etc.)

**Pros:** Full control, simple architecture

```bash
# 1. SSH into server
ssh user@your-server.com

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone repo
git clone your-repo.git
cd your-repo/packages/backend

# 4. Install dependencies
npm install

# 5. Build
npm run build

# 6. Create .env file
cat > .env << EOF
PORT=3001
STRIPE_WEBHOOK_SECRET=whsec_your_secret
AWS_REGION=us-east-1
FIREHOSE_DELIVERY_STREAM_NAME=stripe-webhooks
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
EOF

# 7. Install PM2 for process management
npm install -g pm2

# 8. Start application
pm2 start npm --name "stripe-webhook" -- start
pm2 save
pm2 startup

# 9. Configure nginx reverse proxy
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/webhook
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site and restart nginx
sudo ln -s /etc/nginx/sites-available/webhook /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL certificate
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Post-Deployment

### 1. Configure Stripe Webhook

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click **"Add endpoint"**
3. Enter your endpoint URL: `https://your-domain.com/webhook/stripe`
4. Select events to listen for (or select "all events" for archival)
5. Copy the **signing secret** and update your environment variable

### 2. Test the Webhook

```bash
# Send test webhook from Stripe Dashboard
# or use Stripe CLI
stripe listen --forward-to https://your-domain.com/webhook/stripe

# In another terminal, trigger test event
stripe trigger charge.succeeded
```

### 3. Monitor

**CloudWatch Metrics:**
- Go to CloudWatch → Metrics → Firehose
- Watch: `IncomingRecords`, `DeliveryToS3.Success`, `DeliveryToS3.DataFreshness`

**Application Logs:**
- Check your deployment platform's logs
- Look for "Failed to persist webhook" errors

**S3 Storage:**
```bash
# Check files are being written
aws s3 ls s3://your-bucket-name/webhooks/ --recursive | tail -20
```

### 4. Set Up Alerts

**CloudWatch Alarms** (created by CloudFormation/Terraform):
- Data freshness > 10 minutes
- Delivery success rate < 95%

**Application Monitoring:**
- Consider adding Sentry/Datadog for error tracking
- Set up uptime monitoring (Pingdom, UptimeRobot)

## Security Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] `STRIPE_WEBHOOK_SECRET` configured (signature verification enabled)
- [ ] AWS credentials use IAM role (not access keys) in production
- [ ] S3 bucket has encryption enabled
- [ ] S3 bucket blocks public access
- [ ] Firehose IAM role has minimal permissions
- [ ] Application logs don't contain sensitive data
- [ ] Rate limiting configured (optional, but recommended)

## Troubleshooting

**Webhooks not reaching endpoint:**
- Check firewall/security groups allow inbound HTTPS
- Verify DNS is resolving correctly
- Test with curl: `curl -X POST https://your-domain.com/webhook/stripe`

**Signature verification failing:**
- Confirm `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Check raw body is being passed (not parsed JSON)
- Verify webhook endpoint URL in Stripe matches exactly

**Data not appearing in S3:**
- Wait 5 minutes (default buffer interval)
- Check CloudWatch logs: `/aws/kinesisfirehose/stripe-webhooks`
- Verify Firehose IAM role has S3 write permissions
- Check application logs for Firehose errors

**High latency:**
- Consider using SQS as buffer (see architecture notes)
- Check AWS region matches Firehose region
- Monitor CloudWatch metrics for throttling

## Scaling Considerations

**Low volume (< 100/second):**
- Single instance is fine
- No special configuration needed

**Medium volume (100-1000/second):**
- Use auto-scaling (ECS, Lambda, or horizontal scaling)
- Consider request batching with `PutRecordBatch`
- Monitor Firehose throughput limits

**High volume (> 1000/second):**
- Request Firehose limit increase
- Use multiple delivery streams (shard by event type)
- Consider SQS buffer for better error isolation
- Add rate limiting/backpressure handling
