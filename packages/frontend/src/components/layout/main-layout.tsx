import { ReactNode } from "react"
import { Sidebar } from "./sidebar"

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 bg-muted/30">
        <Sidebar />
      </div>
      <div className="flex-1 bg-muted/30 overflow-hidden">
        <main className="rounded-lg border bg-card h-full my-1.5 mr-1.5 ml-0 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
