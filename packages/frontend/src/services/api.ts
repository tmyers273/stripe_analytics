export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface CounterResponse {
  count: number
}

export interface UpdateCounterRequest {
  action: 'increment' | 'decrement' | 'reset'
}

export interface AuthResponse {
  success: boolean
  user: {
    id: string
    email: string
    name: string
    defaultOrganizationId: string | null
  }
  memberships: Array<{
    organizationId: string
    organizationName: string
    role: 'owner' | 'admin' | 'member'
  }>
  activeOrganizationId: string | null
}

export interface ApiErrorPayload {
  success?: boolean
  error?: string
  [key: string]: unknown
}

class ApiError extends Error {
  status: number
  payload?: ApiErrorPayload

  constructor(message: string, status: number, payload?: ApiErrorPayload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`

    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    const contentType = response.headers.get('content-type') ?? ''
    const isJson = contentType.includes('application/json')
    const data = isJson ? await response.json() : null

    if (!response.ok) {
      const errorMessage =
        (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
          ? data.error
          : `API Error: ${response.status} ${response.statusText}`)

      throw new ApiError(errorMessage, response.status, data ?? undefined)
    }

    return data as T
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

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(payload: {
    email: string
    password: string
    name: string
    organizationName: string
  }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async logout(): Promise<void> {
    await this.request('/api/auth/logout', { method: 'POST' })
  }

  async fetchCurrentUser(): Promise<AuthResponse> {
    return this.request<AuthResponse>('/api/auth/me')
  }

  async switchOrganization(organizationId: string): Promise<{
    success: boolean
    activeOrganizationId: string | null
    memberships?: AuthResponse['memberships']
  }> {
    return this.request('/api/auth/switch', {
      method: 'POST',
      body: JSON.stringify({ organizationId }),
    })
  }

  async listOrganizations(): Promise<{ success: boolean; memberships: AuthResponse['memberships'] }> {
    return this.request('/api/organizations')
  }

  async createOrganization(name: string): Promise<{
    success: boolean
    organization: { id: string; name: string; plan: string }
    memberships: AuthResponse['memberships']
    activeOrganizationId: string
  }> {
    return this.request('/api/organizations', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  }

  async addOrganizationMember(organizationId: string, payload: { email: string; role: 'admin' | 'member' }) {
    return this.request(`/api/organizations/${organizationId}/members`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health')
  }
}

export const apiService = new ApiService()
export { ApiError }
