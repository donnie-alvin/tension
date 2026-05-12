'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { initials } from '@traycer/shared'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ProfilePage() {
  const { data: session } = useSession()
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const email = session?.user?.email ?? 'dev@traycer.ai'
  const displayName = name || session?.user?.name || 'Traycer User'

  useEffect(() => {
    setName(session?.user?.name ?? 'Traycer User')
  }, [session?.user?.name])

  async function saveProfile() {
    setIsSaving(true)
    await new Promise<void>((resolve) => window.setTimeout(resolve, 500))
    setIsSaving(false)
    toast.success('Profile saved')
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account details and password.
        </p>
      </div>

      <div className="space-y-6 rounded-lg border p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={session?.user?.image ?? undefined} alt={displayName} />
            <AvatarFallback className="text-lg">
              {initials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{displayName}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="profileName">Name</Label>
            <Input
              id="profileName"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profileEmail">Email</Label>
            <Input id="profileEmail" value={email} disabled />
          </div>
        </div>

        <div className="space-y-4 border-t pt-6">
          <h2 className="text-base font-semibold">Change password</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
              <Input id="confirmNewPassword" type="password" />
            </div>
          </div>
        </div>

        <Button type="button" disabled={isSaving} onClick={saveProfile}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  )
}
