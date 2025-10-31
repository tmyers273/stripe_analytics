import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { MainLayout } from './components/layout/main-layout'
import { DashboardHeader } from './components/dashboard/DashboardHeader'
import { DynamicDashboard } from './components/dashboard/DynamicDashboard'
import { homeDashboardConfig, marketingDashboardConfig, customerSuccessDashboardConfig } from './types/dashboardData'
import { MarketingHeader } from './components/dashboard/MarketingHeader'
import { CustomerSuccessHeader } from './components/dashboard/CustomerSuccessHeader'

const App = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <Tabs defaultValue="home" className="space-y-4">
          <TabsList>
            <div className="text-lg font-semibold text-gray-900 mr-6">Dashboards</div>
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="customer-success">Customer Success</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="home" className="space-y-4">
            <div className="space-y-4 px-6">
              <DashboardHeader />
              
              <div className="border p-2 rounded-xl bg-muted/30 relative">
                <DynamicDashboard config={homeDashboardConfig} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="marketing" className="space-y-4">
            <div className="space-y-4 px-6">
              <MarketingHeader />
              <div className="border p-2 rounded-xl bg-muted/30 relative">
                <DynamicDashboard config={marketingDashboardConfig} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="customer-success" className="space-y-4">
            <div className="space-y-4 px-6">
              <CustomerSuccessHeader />
              <div className="border p-2 rounded-xl bg-muted/30 relative">
                <DynamicDashboard config={customerSuccessDashboardConfig} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="finance" className="space-y-4">
            <div className="px-6">
              <Card>
                <CardHeader>
                  <CardTitle>Finance Dashboard</CardTitle>
                  <CardDescription>
                    Financial metrics and reporting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Finance content coming soon...</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}

export default App
