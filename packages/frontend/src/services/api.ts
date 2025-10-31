const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface CounterResponse {
  count: number
}

export interface UpdateCounterRequest {
  action: 'increment' | 'decrement' | 'reset'
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getCounter(): Promise<CounterResponse> {
    return this.request<CounterResponse>('/api/counter')
  }

  async updateCounter(action: UpdateCounterRequest['action']): Promise<CounterResponse> {
    return this.request<CounterResponse>('/api/counter', {
      method: 'POST',
      body: JSON.stringify({ action }),
    })
  }

  async setCounter(count: number): Promise<CounterResponse> {
    return this.request<CounterResponse>('/api/counter', {
      method: 'PUT',
      body: JSON.stringify({ count }),
    })
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health')
  }
}

export const apiService = new ApiService()
