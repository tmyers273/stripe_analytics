import { Hono } from 'hono'
import { FirehoseClient, PutRecordCommand } from '@aws-sdk/client-firehose'
import Stripe from 'stripe'

const webhookRoutes = new Hono()

// Initialize Firehose client
const firehoseClient = new FirehoseClient({
  region: process.env.AWS_REGION || 'us-east-1',
})

const deliveryStreamName = process.env.FIREHOSE_DELIVERY_STREAM_NAME || 'stripe-webhooks'
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

if (!webhookSecret) {
  console.warn('WARNING: STRIPE_WEBHOOK_SECRET is not set. Webhook signature verification is disabled!')
}

/**
 * Stripe webhook endpoint
 * Receives webhooks from Stripe and persists them to Kinesis Firehose
 */
webhookRoutes.post('/', async (c) => {
  try {
    // Get raw body for signature verification
    const rawBody = await c.req.text()
    const signature = c.req.header('stripe-signature')

    let webhookEvent: Stripe.Event

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      try {
        webhookEvent = Stripe.webhooks.constructEvent(
          rawBody,
          signature,
          webhookSecret
        )
      } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return c.json(
          { error: 'Invalid signature' },
          400
        )
      }
    } else {
      // Parse without verification (not recommended for production)
      webhookEvent = JSON.parse(rawBody) as Stripe.Event
    }

    // Prepare the data for Firehose
    const record = {
      timestamp: new Date().toISOString(),
      type: webhookEvent.type,
      id: webhookEvent.id,
      data: webhookEvent,
    }

    // Write to Firehose before acknowledging
    await firehoseClient.send(
      new PutRecordCommand({
        DeliveryStreamName: deliveryStreamName,
        Record: {
          Data: Buffer.from(JSON.stringify(record) + '\n'), // newline-delimited JSON
        },
      })
    )

    // Only acknowledge after successful write
    return c.json({ received: true })
  } catch (error) {
    console.error('Failed to persist webhook to Firehose:', error)

    // Return 500 so Stripe will retry
    return c.json(
      { error: 'Storage unavailable' },
      500
    )
  }
})

export { webhookRoutes }
