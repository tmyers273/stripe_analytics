import { makeAutoObservable, runInAction } from 'mobx'
import { apiService, ApiError, type AuthResponse } from '../services/api'

type Membership = AuthResponse['memberships'][number]

class AuthStore {
  user: AuthResponse['user'] | null = null
  memberships: Membership[] = []
  activeOrganizationId: string | null = null
  isLoading = false
  isInitialized = false
  error: string | null = null
  organizationActionPending = false

  constructor() {
    makeAutoObservable(this)
  }

  get isAuthenticated(): boolean {
    return Boolean(this.user && this.activeOrganizationId)
  }

  async initialize(): Promise<void> {
    this.isLoading = true
    this.error = null

    try {
      const data = await apiService.fetchCurrentUser()
      runInAction(() => {
        this.applyAuthResponse(data)
        this.isInitialized = true
      })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        runInAction(() => {
          this.reset()
          this.isInitialized = true
        })
      } else {
        runInAction(() => {
          this.error = error instanceof Error ? error.message : 'Failed to initialize auth'
        })
      }
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  async login(email: string, password: string): Promise<void> {
    this.isLoading = true
    this.error = null

    try {
      const data = await apiService.login(email, password)
      runInAction(() => {
        this.applyAuthResponse(data)
      })
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Login failed'
        this.reset()
      })
      throw error
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  async register(payload: {
    email: string
    password: string
    name: string
    organizationName: string
  }): Promise<void> {
    this.isLoading = true
    this.error = null

    try {
      const data = await apiService.register(payload)
      runInAction(() => {
        this.applyAuthResponse(data)
      })
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Registration failed'
        this.reset()
      })
      throw error
    } finally {
      runInAction(() => {
        this.isLoading = false
      })
    }
  }

  async logout(): Promise<void> {
    try {
      await apiService.logout()
    } finally {
      runInAction(() => {
        this.reset()
      })
    }
  }

  async switchOrganization(organizationId: string): Promise<void> {
    this.organizationActionPending = true
    this.error = null

    try {
      const data = await apiService.switchOrganization(organizationId)
      runInAction(() => {
        this.activeOrganizationId = data.activeOrganizationId ?? organizationId
        if (data.memberships) {
          this.memberships = data.memberships
        }
      })
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to switch organization'
      })
      throw error
    } finally {
      runInAction(() => {
        this.organizationActionPending = false
      })
    }
  }

  async createOrganization(name: string): Promise<void> {
    this.organizationActionPending = true
    this.error = null

    try {
      const data = await apiService.createOrganization(name)
      runInAction(() => {
        this.memberships = data.memberships
        this.activeOrganizationId = data.activeOrganizationId
        if (this.user) {
          this.user = { ...this.user, defaultOrganizationId: data.activeOrganizationId }
        }
      })
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to create organization'
      })
      throw error
    } finally {
      runInAction(() => {
        this.organizationActionPending = false
      })
    }
  }

  async addMember(email: string, role: 'admin' | 'member' = 'member'): Promise<void> {
    if (!this.activeOrganizationId) {
      this.error = 'No active organization selected'
      return
    }

    this.organizationActionPending = true
    this.error = null

    try {
      await apiService.addOrganizationMember(this.activeOrganizationId, { email, role })
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to add member'
      })
      throw error
    } finally {
      runInAction(() => {
        this.organizationActionPending = false
      })
    }
  }

  private applyAuthResponse(response: AuthResponse): void {
    this.user = response.user
    this.memberships = response.memberships
    this.activeOrganizationId = response.activeOrganizationId ?? null
    this.error = null
  }

  private reset(): void {
    this.user = null
    this.memberships = []
    this.activeOrganizationId = null
    this.organizationActionPending = false
  }
}

export const authStore = new AuthStore()
