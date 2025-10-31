import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const counterSchema = z.object({
  count: z.number().int().min(0).default(0)
})

const updateCounterSchema = z.object({
  action: z.enum(['increment', 'decrement', 'reset'])
})

export const counterRoutes = new Hono()

let counter = { count: 0 }

// Get current counter value
counterRoutes.get('/', (c) => {
  return c.json(counter)
})

// Update counter
counterRoutes.post(
  '/',
  zValidator('json', updateCounterSchema),
  async (c) => {
    const { action } = c.req.valid('json')
    
    switch (action) {
      case 'increment':
        counter.count++
        break
      case 'decrement':
        if (counter.count > 0) {
          counter.count--
        }
        break
      case 'reset':
        counter.count = 0
        break
    }
    
    return c.json(counter)
  }
)

// Reset counter to specific value
counterRoutes.put(
  '/',
  zValidator('json', counterSchema),
  async (c) => {
    const newCounter = c.req.valid('json')
    counter = newCounter
    return c.json(counter)
  }
)
