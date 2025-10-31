import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { counterRoutes } from './routes/counter'
import { webhookRoutes } from './routes/stripe-webhook'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Routes
app.route('/api/counter', counterRoutes)
app.route('/webhook/stripe', webhookRoutes)

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Root route
app.get('/', (c) => {
  return c.json({
    message: 'Stripe Analytics Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      counter: '/api/counter',
      stripeWebhook: '/webhook/stripe'
    }
  })
})

const port = parseInt(process.env.PORT || '3001')

console.log(`🚀 Server starting on port ${port}`)

export default {
  port,
  fetch: app.fetch,
}
