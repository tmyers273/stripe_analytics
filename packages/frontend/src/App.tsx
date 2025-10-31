import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { MainLayout } from './components/layout/main-layout'
import { DashboardHeader } from './components/dashboard/DashboardHeader'
import { TopWinsCard } from './components/dashboard/TopWinsCard'
import { MrrBreakdownCard } from './components/dashboard/MrrBreakdownCard'
import { MrrMovementsChart } from './components/dashboard/MrrMovementsChart'
import { ArrChart } from './components/dashboard/ArrChart'
import { MrrCard } from './components/dashboard/MrrCard'
import { mrrData, arrDataNew, mrrGrowthData } from './data/mrrData'

const App = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <div className="text-lg font-semibold text-gray-900 mr-6">Dashboards</div>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="real-time">Real-time</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-4 px-6">
              <DashboardHeader />
              
              <div className="grid gap-6 lg:grid-cols-2">
                <TopWinsCard />
                <MrrBreakdownCard />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <MrrMovementsChart data={mrrData.entries} />
                <ArrChart data={arrDataNew.entries} />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <MrrCard data={mrrGrowthData.entries} />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <div className="px-6">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics Dashboard</CardTitle>
                  <CardDescription>
                    Detailed analytics and insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Analytics content coming soon...</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="reports" className="space-y-4">
            <div className="px-6">
              <Card>
                <CardHeader>
                  <CardTitle>Reports</CardTitle>
                  <CardDescription>
                    Generate and view reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Reports content coming soon...</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="real-time" className="space-y-4">
            <div className="px-6">
              <Card>
                <CardHeader>
                  <CardTitle>Real-time Data</CardTitle>
                  <CardDescription>
                    Live data streaming and monitoring
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Real-time monitoring coming soon...</p>
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
