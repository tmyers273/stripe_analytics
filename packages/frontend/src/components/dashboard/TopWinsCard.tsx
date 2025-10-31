import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const topWinsData = [
  {
    customer: "Ecom Republic Pty Ltd",
    mrr: 29,
    arr: 348,
    plan: "Senja Starter · New pricing 2024",
  },
  {
    customer: "The Good Patch",
    mrr: 29,
    arr: 348,
    plan: "Senja Starter · New pricing 2024",
  },
  {
    customer: "Senja",
    mrr: 29,
    arr: 348,
    plan: "Senja Starter · New pricing 2024",
  },
  {
    customer: "Verve Project Management",
    mrr: 49,
    arr: 588,
    plan: "Senja Starter · New pricing 2024",
  },
  {
    customer: "Kognic",
    mrr: 49,
    arr: 588,
    plan: "Senja Starter · New pricing 2024",
  },
  {
    customer: "Scribe",
    mrr: 99,
    arr: 1188,
    plan: "Senja Pro · New pricing 2024",
  },
]

export function TopWinsCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏆</span>
            <CardTitle className="text-base font-semibold">
              Top wins from this week
            </CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs">
            21 CUSTOMERS
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">MRR</TableHead>
              <TableHead className="text-right">ARR</TableHead>
              <TableHead>Plan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topWinsData.map((row, index) => (
              <TableRow key={index} className="border-b-0">
                <TableCell className="py-2">{row.customer}</TableCell>
                <TableCell className="text-right py-2">${row.mrr}</TableCell>
                <TableCell className="text-right py-2">${row.arr}</TableCell>
                <TableCell className="text-muted-foreground text-sm py-2">
                  {row.plan}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
