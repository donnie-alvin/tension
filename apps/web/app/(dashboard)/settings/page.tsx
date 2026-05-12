'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Singapore',
  'Australia/Sydney',
]

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">General</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure workspace defaults for the dashboard.
        </p>
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <div className="space-y-2">
          <Label htmlFor="workspaceName">Workspace Name</Label>
          <Input
            id="workspaceName"
            readOnly
            placeholder="Traycer Platform"
            className="max-w-md"
          />
        </div>

        <div className="space-y-2">
          <Label>Timezone</Label>
          <Select defaultValue="Europe/London">
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((timezone) => (
                <SelectItem key={timezone} value={timezone}>
                  {timezone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="button" onClick={() => toast.success('Settings saved')}>
          Save
        </Button>
      </div>
    </div>
  )
}
