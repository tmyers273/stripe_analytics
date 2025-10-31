import { observer } from 'mobx-react-lite'
import { useCounterStore } from './stores/counterStore'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'

const App = observer(() => {
  const counterStore = useCounterStore()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Stripe Analytics</CardTitle>
          <CardDescription>
            Monorepo demo with React, TypeScript, TailwindCSS, shadcn/ui, and MobX
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{counterStore.count}</p>
            <p className="text-sm text-muted-foreground">Counter value</p>
          </div>
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
    </div>
  )
})

export default App
