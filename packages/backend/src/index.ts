import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { counterRoutes } from './routes/counter'
import { dashboardRoutes } from './routes/dashboards'

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
app.route('/api/dashboards', dashboardRoutes)

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
      dashboards: '/api/dashboards'
    }
  })
})

const port = parseInt(process.env.PORT || '3001')

// Node runtime - use node:http
const { createServer } = await import('node:http')
const server = createServer(async (req, res) => {
  const response = await app.fetch(new Request(`http://localhost:${port}${req.url}`, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? await new Promise<Buffer>((resolve) => {
      const chunks: Buffer[] = []
      req.on('data', (chunk) => chunks.push(chunk))
      req.on('end', () => resolve(Buffer.concat(chunks)))
    }) : undefined,
  }))

  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })

  const body = await response.arrayBuffer()
  res.end(Buffer.from(body))
})

server.listen(port, () => {
  console.log(`✅ Server is listening on http://localhost:${port}`)
})
