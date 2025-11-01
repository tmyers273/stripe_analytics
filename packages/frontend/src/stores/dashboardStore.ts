import { makeAutoObservable, runInAction } from 'mobx'
import type { DashboardConfig } from '../types/dashboardData'
import { API_BASE_URL } from '../services/api'

export interface Dashboard {
  id: string
  name: string
  widgets: DashboardConfig['widgets']
}

export interface DashboardsResponse {
  dashboards: Dashboard[]
}

class DashboardStore {
  dashboards: Dashboard[] = []
  activeDashboardId: string = 'home'
  isLoading: boolean = false
  error: string | null = null
  isEditMode: boolean = false

  constructor() {
    makeAutoObservable(this)
  }

  setEditMode(enabled: boolean) {
    this.isEditMode = enabled
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode
  }

  reset() {
    this.dashboards = []
    this.activeDashboardId = 'home'
    this.isLoading = false
    this.error = null
    this.isEditMode = false
  }

  get activeDashboard(): Dashboard | undefined {
    return this.dashboards.find(d => d.id === this.activeDashboardId)
  }

  setActiveDashboard(id: string) {
    this.activeDashboardId = id
  }

  async loadDashboards() {
    this.isLoading = true
    this.error = null

    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboards`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Failed to load dashboards: ${response.statusText}`)
      }

      const data: DashboardsResponse = await response.json()

      runInAction(() => {
        this.dashboards = data.dashboards
        this.isLoading = false
      })
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Failed to load dashboards'
        this.isLoading = false
      })
      console.error('Error loading dashboards:', err)
    }
  }

  async saveDashboard(dashboard: Dashboard) {
    this.isLoading = true
    this.error = null

    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboards/${dashboard.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dashboard),
      })

      if (!response.ok) {
        throw new Error(`Failed to save dashboard: ${response.statusText}`)
      }

      const updatedDashboard: Dashboard = await response.json()

      runInAction(() => {
        const index = this.dashboards.findIndex(d => d.id === dashboard.id)
        if (index !== -1) {
          this.dashboards[index] = updatedDashboard
        }
        this.isLoading = false
      })
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Failed to save dashboard'
        this.isLoading = false
      })
      console.error('Error saving dashboard:', err)
      throw err
    }
  }

  async createDashboard(dashboard: Dashboard) {
    this.isLoading = true
    this.error = null

    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dashboard),
      })

      if (!response.ok) {
        throw new Error(`Failed to create dashboard: ${response.statusText}`)
      }

      const newDashboard: Dashboard = await response.json()

      runInAction(() => {
        this.dashboards.push(newDashboard)
        this.isLoading = false
      })
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Failed to create dashboard'
        this.isLoading = false
      })
      console.error('Error creating dashboard:', err)
      throw err
    }
  }

  async deleteDashboard(dashboardId: string) {
    this.isLoading = true
    this.error = null

    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboards/${dashboardId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete dashboard: ${response.statusText}`)
      }

      runInAction(() => {
        this.dashboards = this.dashboards.filter(d => d.id !== dashboardId)
        // If we deleted the active dashboard, switch to the first one
        if (this.activeDashboardId === dashboardId && this.dashboards.length > 0) {
          this.activeDashboardId = this.dashboards[0].id
        }
        this.isLoading = false
      })
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Failed to delete dashboard'
        this.isLoading = false
      })
      console.error('Error deleting dashboard:', err)
      throw err
    }
  }

  updateDashboardLocally(dashboard: Dashboard) {
    const index = this.dashboards.findIndex(d => d.id === dashboard.id)
    if (index !== -1) {
      this.dashboards[index] = dashboard
    }
  }
}

export const dashboardStore = new DashboardStore()
