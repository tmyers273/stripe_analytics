import { observer } from "mobx-react-lite"
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

import { OrganizationSwitcher } from "@/components/organization/OrganizationSwitcher"
import { authStore } from "@/stores/authStore"
import { dashboardStore } from "@/stores/dashboardStore"

interface SidebarProps {
  className?: string
}

export const Sidebar = observer(({ className }: SidebarProps) => {
  const name = authStore.user?.name ?? ''
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2) || 'U'

  const handleLogout = async () => {
    await authStore.logout()
    dashboardStore.reset()
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex-1 pb-12 w-64">
        <div className="space-y-4 py-4">
          <div className="px-3 py-2">
            <div className="flex items-center pl-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg mr-3"></div>
              <h2 className="text-xl font-bold text-foreground">Stripe Analytics</h2>
            </div>
            <OrganizationSwitcher />
            <div className="h-6" />
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
      <div className="border-t p-4 space-y-3">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{authStore.user?.name ?? 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{authStore.user?.email ?? '—'}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </div>
  )
})
