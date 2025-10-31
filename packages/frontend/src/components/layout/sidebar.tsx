import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  BarChart3, 
  CreditCard, 
  Settings, 
  Users, 
  Home,
  TrendingUp 
} from "lucide-react"

interface SidebarItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  isActive?: boolean
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Dashboards",
    icon: Home,
    href: "/",
    isActive: true,
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/analytics",
  },
  {
    title: "Transactions",
    icon: CreditCard,
    href: "/transactions",
  },
  {
    title: "Customers",
    icon: Users,
    href: "/customers",
  },
  {
    title: "Revenue",
    icon: TrendingUp,
    href: "/revenue",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex-1 pb-12 w-64">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <div className="flex items-center pl-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg mr-3"></div>
              <h2 className="text-xl font-bold text-foreground">Stripe Analytics</h2>
            </div>
            <div className="space-y-1">
              {sidebarItems.map((item) => (
                <Button
                  key={item.href}
                  variant={item.isActive ? "secondary" : "ghost"}
                  className="w-full justify-start"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* User profile at bottom */}
      <div className="border-t p-4">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">User</p>
            <p className="text-xs text-muted-foreground truncate">user@example.com</p>
          </div>
        </div>
      </div>
    </div>
  )
}
