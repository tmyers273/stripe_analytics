import { useState, useRef, useEffect } from "react"
import { Filter, Plus, Check, X, Pencil, Move } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { observer } from "mobx-react-lite"
import { dashboardStore } from "@/stores/dashboardStore"

interface EditableDashboardHeaderProps {
  dashboardId: string
  dashboardName: string
}

export const EditableDashboardHeader = observer(({ dashboardId, dashboardName }: EditableDashboardHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(dashboardName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = async () => {
    if (editedName.trim() && editedName !== dashboardName) {
      const dashboard = dashboardStore.dashboards.find(d => d.id === dashboardId)
      if (dashboard) {
        try {
          await dashboardStore.saveDashboard({
            ...dashboard,
            name: editedName.trim()
          })
        } catch (error) {
          console.error('Failed to save dashboard name:', error)
          setEditedName(dashboardName) // Revert on error
        }
      }
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedName(dashboardName)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-lg font-semibold h-8 w-64"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleSave}
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={handleCancel}
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-semibold">{dashboardName}</h1>
            <button
              className="text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsEditing(true)}
              title="Edit dashboard name"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={dashboardStore.isEditMode ? "default" : "outline"}
          size="sm"
          onClick={() => dashboardStore.toggleEditMode()}
          title={dashboardStore.isEditMode ? "Exit edit mode" : "Enter edit mode to rearrange widgets"}
          className="gap-2"
        >
          <Move className="h-4 w-4" />
          {dashboardStore.isEditMode ? "Done" : "Edit Layout"}
        </Button>
        <Button variant="outline" size="icon" title="Filter (coming soon)">
          <Filter className="h-4 w-4" />
        </Button>
        <Button size="icon" title="Add widget (coming soon)">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})
