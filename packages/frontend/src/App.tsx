import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { MainLayout } from './components/layout/main-layout'
import { DashboardHeader } from './components/dashboard/DashboardHeader'
import { DynamicDashboard } from './components/dashboard/DynamicDashboard'
import { MarketingHeader } from './components/dashboard/MarketingHeader'
import { CustomerSuccessHeader } from './components/dashboard/CustomerSuccessHeader'
import { dashboardStore } from './stores/dashboardStore'

const App = observer(() => {
  useEffect(() => {
    // Load dashboards when the app starts
    dashboardStore.loadDashboards()
  }, [])

  const handleTabChange = (value: string) => {
    dashboardStore.setActiveDashboard(value)
  }

  // Helper function to get the appropriate header component
  const getDashboardHeader = (dashboardId: string) => {
    switch (dashboardId) {
      case 'home':
        return <DashboardHeader />
      case 'marketing':
        return <MarketingHeader />
      case 'customer-success':
        return <CustomerSuccessHeader />
      default:
        return (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {dashboardStore.dashboards.find(d => d.id === dashboardId)?.name || 'Dashboard'}
              </h1>
            </div>
          </div>
        )
    }
  }

  if (dashboardStore.isLoading && dashboardStore.dashboards.length === 0) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading dashboards...</p>
        </div>
      </MainLayout>
    )
  }

  if (dashboardStore.error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Error Loading Dashboards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">{dashboardStore.error}</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <Tabs
          value={dashboardStore.activeDashboardId}
          onValueChange={handleTabChange}
          className="space-y-4"
        >
          <TabsList>
            <div className="text-lg font-semibold text-gray-900 mr-6">Dashboards</div>
            {dashboardStore.dashboards.map(dashboard => (
              <TabsTrigger key={dashboard.id} value={dashboard.id}>
                {dashboard.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {dashboardStore.dashboards.map(dashboard => (
            <TabsContent key={dashboard.id} value={dashboard.id} className="space-y-4">
              <div className="space-y-4 px-6">
                {getDashboardHeader(dashboard.id)}

                {dashboard.widgets.length > 0 ? (
                  <div className="border p-2 rounded-xl bg-muted/30 relative">
                    <DynamicDashboard config={{ widgets: dashboard.widgets }} />
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>{dashboard.name} Dashboard</CardTitle>
                      <CardDescription>
                        This dashboard is empty
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">Add widgets to get started...</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  )
})

export default App
