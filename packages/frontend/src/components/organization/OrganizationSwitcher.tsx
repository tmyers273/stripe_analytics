import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { authStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const OrganizationSwitcher = observer(() => {
  const [isCreating, setIsCreating] = useState(false)
  const [newOrgName, setNewOrgName] = useState('')
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState<'admin' | 'member'>('member')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSwitch = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const organizationId = event.target.value
    if (organizationId) {
      setSuccessMessage('')
      await authStore.switchOrganization(organizationId)
    }
  }

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newOrgName.trim()) return

    try {
      await authStore.createOrganization(newOrgName.trim())
      setNewOrgName('')
      setIsCreating(false)
      setSuccessMessage('Organization created')
    } catch (error) {
      console.error(error)
    }
  }

  const handleAddMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!memberEmail.trim()) return

    try {
      await authStore.addMember(memberEmail.trim(), memberRole)
      setMemberEmail('')
      setMemberRole('member')
      setIsAddingMember(false)
      setSuccessMessage('Member added')
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="space-y-3">
      {successMessage && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {successMessage}
        </div>
      )}
      {authStore.error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {authStore.error}
        </div>
      )}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Organization
        </label>
        <select
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={authStore.activeOrganizationId ?? ''}
          onChange={handleSwitch}
          disabled={authStore.organizationActionPending || authStore.memberships.length === 0}
        >
          {authStore.memberships.map((membership) => (
            <option key={membership.organizationId} value={membership.organizationId}>
              {membership.organizationName}
            </option>
          ))}
        </select>
      </div>

      {isCreating ? (
        <form className="space-y-2" onSubmit={handleCreate}>
          <Input
            placeholder="New organization name"
            value={newOrgName}
            onChange={(event) => setNewOrgName(event.target.value)}
            disabled={authStore.organizationActionPending}
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="flex-1" disabled={authStore.organizationActionPending}>
              Create
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsCreating(false)
                setNewOrgName('')
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => {
            setIsCreating(true)
            setSuccessMessage('')
          }}
        >
          New organization
        </Button>
      )}

      {isAddingMember ? (
        <form className="space-y-2" onSubmit={handleAddMember}>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted-foreground">Team member email</label>
            <Input
              type="email"
              placeholder="teammate@example.com"
              value={memberEmail}
              onChange={(event) => setMemberEmail(event.target.value)}
              disabled={authStore.organizationActionPending}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-muted-foreground">Role</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={memberRole}
              onChange={(event) => setMemberRole(event.target.value as 'admin' | 'member')}
              disabled={authStore.organizationActionPending}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="flex-1" disabled={authStore.organizationActionPending}>
              Add member
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsAddingMember(false)
                setMemberEmail('')
                setMemberRole('member')
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setIsAddingMember(true)
            setSuccessMessage('')
          }}
        >
          Add member
        </Button>
      )}
    </div>
  )
})
