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
import { NewBizReactivationChart } from './components/dashboard/NewBizReactivationChart'
import { newBizReactivationData } from './data/newBizReactivationData'
import { SubscribersChart } from './components/dashboard/SubscribersChart'
import { subscribersData } from './data/subscribersData'
import { ArpaChart } from './components/dashboard/ArpaChart'
import { arpaData } from './data/arpaData'
import { ArrCohortsChart } from './components/dashboard/ArrCohortsChart'
import { arrCohortsData } from './data/arrCohortsData'

const App = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <Tabs defaultValue="home" className="space-y-4">
          <TabsList>
            <div className="text-lg font-semibold text-gray-900 mr-6">Dashboards</div>
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="customer-success">Customer Success</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="home" className="space-y-4">
            <div className="space-y-4 px-6">
              <DashboardHeader />
              
              <div className="border p-2 rounded-xl bg-muted/30">
                <div className="space-y-2">
                  <div className="grid gap-2 lg:grid-cols-2">
                    <TopWinsCard />
                    <MrrBreakdownCard />
                  </div>

                  <div className="grid gap-2 lg:grid-cols-2">
                    <MrrMovementsChart data={mrrData.entries} />
                    <ArrChart data={arrDataNew.entries} />
                  </div>

                  <div className="grid gap-2 lg:grid-cols-2">
                    <MrrCard data={mrrGrowthData.entries} />
                    <SubscribersChart data={subscribersData.entries} />
                  </div>

                  <div className="grid gap-2 lg:grid-cols-2">
                    <ArpaChart data={arpaData.entries} />
                    <ArrCohortsChart data={arrCohortsData} />
                  </div>

                  <div className="grid gap-2 lg:grid-cols-1">
                    <NewBizReactivationChart data={newBizReactivationData.entries} />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="sales" className="space-y-4">
            <div className="px-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Dashboard</CardTitle>
                  <CardDescription>
                    Sales performance and metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Sales content coming soon...</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="marketing" className="space-y-4">
            <div className="px-6">
              <Card>
                <CardHeader>
                  <CardTitle>Marketing Dashboard</CardTitle>
                  <CardDescription>
                    Marketing campaigns and performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Marketing content coming soon...</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="customer-success" className="space-y-4">
            <div className="px-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Success Dashboard</CardTitle>
                  <CardDescription>
                    Customer satisfaction and retention metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Customer Success content coming soon...</p>
                </CardContent>
              </Card>
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
