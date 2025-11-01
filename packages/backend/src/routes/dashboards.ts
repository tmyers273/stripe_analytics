import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

// Dashboard config schema
const dashboardConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  widgets: z.array(z.any()), // Use z.any() to avoid strict typing issues
})

// Initial dashboard configurations
let dashboards: any[] = [
  {
    id: 'home',
    name: 'Home',
    widgets: [
      {
        grid: { x: 0, y: 0, width: 1, height: 3 },
        kind: 'mrr_breakdown' as const,
        metric: 'customer_activity',
      },
      {
        grid: { x: 1, y: 0, width: 1, height: 3 },
        kind: 'customer_list' as const,
        metric: 'customer_list',
      },
      {
        grid: { x: 0, y: 3, width: 1, height: 3 },
        kind: 'custom_chart' as const,
        metric: 'mrr_movements',
        config: { customType: 'mrr_movements' },
      },
      {
        grid: { x: 1, y: 3, width: 1, height: 3 },
        kind: 'custom_chart' as const,
        metric: 'arr_growth',
        config: { customType: 'arr_growth' },
      },
      {
        grid: { x: 0, y: 6, width: 1, height: 2 },
        kind: 'chart' as const,
        metric: 'mrr_growth',
        url: '/api/mrr',
      },
      {
        grid: { x: 1, y: 6, width: 1, height: 3 },
        kind: 'chart' as const,
        metric: 'mrr_movements',
        url: '/api/mrr-movements',
        chart: {
          shape: 'bar' as const,
          interval: 'month',
          interval_count: 12,
        },
      },
      {
        grid: { x: 0, y: 9, width: 1, height: 2 },
        kind: 'chart' as const,
        metric: 'customer_growth',
        url: '/api/subscribers',
        chart: {
          shape: 'area' as const,
          interval: 'month',
          interval_count: 12,
        },
      },
      {
        grid: { x: 1, y: 9, width: 1, height: 2 },
        kind: 'chart' as const,
        metric: 'arpa',
        url: '/api/arpa',
        chart: {
          shape: 'line' as const,
          interval: 'month',
          interval_count: 12,
        },
      },
      {
        grid: { x: 0, y: 11, width: 2, height: 3 },
        kind: 'custom_chart' as const,
        metric: 'arr_growth',
        config: { customType: 'arr_cohorts' },
      },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing',
    widgets: [
      {
        grid: { x: 0, y: 0, width: 1, height: 2 },
        kind: 'chart' as const,
        metric: 'leads',
        url: '/api/leads',
        chart: {
          shape: 'area' as const,
          interval: 'month',
          interval_count: 12,
        },
      },
      {
        grid: { x: 1, y: 0, width: 1, height: 2 },
        kind: 'chart' as const,
        metric: 'free_trials',
        url: '/api/free-trials',
        chart: {
          shape: 'area' as const,
          interval: 'month',
          interval_count: 12,
        },
      },
    ],
  },
  {
    id: 'customer-success',
    name: 'Customer Success',
    widgets: [
      {
        grid: { x: 0, y: 0, width: 1, height: 2 },
        kind: 'chart' as const,
        metric: 'mrr_churn_rate',
        url: '/api/mrr-churn',
        chart: {
          shape: 'line' as const,
          interval: 'month',
          interval_count: 12,
        },
      },
      {
        grid: { x: 1, y: 0, width: 1, height: 2 },
        kind: 'chart' as const,
        metric: 'customer_churn_rate',
        url: '/api/customer-churn',
        chart: {
          shape: 'line' as const,
          interval: 'month',
          interval_count: 12,
        },
      },
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    widgets: [],
  },
]

export const dashboardRoutes = new Hono()

// Get all dashboards
dashboardRoutes.get('/', (c) => {
  return c.json({ dashboards })
})

// Get a specific dashboard by ID
dashboardRoutes.get('/:id', (c) => {
  const id = c.req.param('id')
  const dashboard = dashboards.find(d => d.id === id)

  if (!dashboard) {
    return c.json({ error: 'Dashboard not found' }, 404)
  }

  return c.json(dashboard)
})

// Create a new dashboard
dashboardRoutes.post(
  '/',
  zValidator('json', dashboardConfigSchema),
  async (c) => {
    const newDashboard = c.req.valid('json')

    // Check if dashboard with this ID already exists
    if (dashboards.find(d => d.id === newDashboard.id)) {
      return c.json({ error: 'Dashboard with this ID already exists' }, 400)
    }

    dashboards.push(newDashboard)
    return c.json(newDashboard, 201)
  }
)

// Update an existing dashboard
dashboardRoutes.put(
  '/:id',
  zValidator('json', dashboardConfigSchema),
  async (c) => {
    const id = c.req.param('id')
    const updatedDashboard = c.req.valid('json')

    const index = dashboards.findIndex(d => d.id === id)

    if (index === -1) {
      return c.json({ error: 'Dashboard not found' }, 404)
    }

    // Ensure the ID in the URL matches the ID in the body
    if (id !== updatedDashboard.id) {
      return c.json({ error: 'Dashboard ID mismatch' }, 400)
    }

    dashboards[index] = updatedDashboard
    return c.json(updatedDashboard)
  }
)

// Delete a dashboard
dashboardRoutes.delete('/:id', (c) => {
  const id = c.req.param('id')
  const index = dashboards.findIndex(d => d.id === id)

  if (index === -1) {
    return c.json({ error: 'Dashboard not found' }, 404)
  }

  const deletedDashboard = dashboards[index]
  dashboards = dashboards.filter(d => d.id !== id)

  return c.json({ message: 'Dashboard deleted', dashboard: deletedDashboard })
})
