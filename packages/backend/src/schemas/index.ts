import { z } from 'zod'

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
})

export type ApiResponse = z.infer<typeof ApiResponseSchema>

export const CounterSchema = z.object({
  count: z.number().int().min(0),
})

export type Counter = z.infer<typeof CounterSchema>

export const UpdateCounterSchema = z.object({
  action: z.enum(['increment', 'decrement', 'reset']),
})

export type UpdateCounter = z.infer<typeof UpdateCounterSchema>
