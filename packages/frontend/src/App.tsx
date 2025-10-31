import { observer } from 'mobx-react-lite'
import { useCounterStore } from './stores/counterStore'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { MainLayout } from './components/layout/main-layout'
import { DashboardHeader } from './components/dashboard/DashboardHeader'
import { TopWinsCard } from './components/dashboard/TopWinsCard'
import { MrrBreakdownCard } from './components/dashboard/MrrBreakdownCard'
import { MrrMovementsChart } from './components/dashboard/MrrMovementsChart'
import { mrrData } from './data/mrrData'

const App = observer(() => {
  const counterStore = useCounterStore()

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboards</h1>
          <p className="text-muted-foreground">
            Welcome to your Stripe Analytics dashboard
          </p>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="real-time">Real-time</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-4">
              <DashboardHeader />
              
              <div className="grid gap-6 lg:grid-cols-2">
                <TopWinsCard />
                <MrrBreakdownCard />
              </div>

              <MrrMovementsChart data={mrrData.entries} />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Counter Demo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{counterStore.count}</div>
                  <p className="text-xs text-muted-foreground">MobX state management</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$45,231.89</div>
                  <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2,350</div>
                  <p className="text-xs text-muted-foreground">+180.1% from last month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12,234</div>
                  <p className="text-xs text-muted-foreground">+19% from last month</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Counter Controls</CardTitle>
                <CardDescription>
                  Demonstration of MobX state management with API integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button 
                    onClick={() => counterStore.increment()} 
                    className="flex-1"
                  >
                    Increment
                  </Button>
                  <Button 
                    onClick={() => counterStore.decrement()} 
                    variant="outline"
                    className="flex-1"
                  >
                    Decrement
                  </Button>
                  <Button 
                    onClick={() => counterStore.reset()} 
                    variant="destructive"
                    className="flex-1"
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
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
          </TabsContent>
          
          <TabsContent value="reports" className="space-y-4">
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
          </TabsContent>
          
          <TabsContent value="real-time" className="space-y-4">
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
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
})

export default App
