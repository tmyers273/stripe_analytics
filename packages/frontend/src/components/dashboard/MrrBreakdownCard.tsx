import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { ChevronDown } from "lucide-react"

const mrrBreakdownData = [
  {
    count: 199,
    label: "New Business MRR",
    amount: 4124,
    isPositive: true,
  },
  {
    count: 39,
    label: "Expansion MRR",
    amount: 1945,
    isPositive: true,
  },
  {
    count: -28,
    label: "Contraction MRR",
    amount: -1450,
    isPositive: false,
  },
  {
    count: -10,
    label: "Churned MRR",
    amount: -2700,
    isPositive: false,
  },
]

export function MrrBreakdownCard() {
  const netMrrMovement = mrrBreakdownData.reduce(
    (total, item) => total + item.amount,
    0
  )

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            MRR Breakdown
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                THIS MONTH
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>This Month</DropdownMenuItem>
              <DropdownMenuItem>Last Month</DropdownMenuItem>
              <DropdownMenuItem>Last Quarter</DropdownMenuItem>
              <DropdownMenuItem>This Year</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {mrrBreakdownData.map((item, index) => (
          <div key={index} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <span
                className={`font-medium ${
                  item.isPositive ? "text-blue-600" : "text-red-600"
                }`}
              >
                {item.isPositive ? "+" : ""}
                {item.count}
              </span>
              <span className="text-sm">{item.label}</span>
            </div>
            <div className="text-sm font-medium">
              {item.isPositive ? "+" : ""}
              ${item.amount.toLocaleString()}
            </div>
          </div>
        ))}
        
        <Separator />
        
        <div className="flex items-center justify-between py-2 font-semibold">
          <span>Net MRR Movement</span>
          <span>
            {netMrrMovement > 0 ? "+" : ""}
            ${netMrrMovement.toLocaleString()}
          </span>
        </div>
        
        <div className="flex items-center justify-between py-2 text-muted-foreground">
          <span>Scheduled MRR Movements</span>
          <span className="text-sm">+$0</span>
        </div>
      </CardContent>
    </Card>
  )
}
