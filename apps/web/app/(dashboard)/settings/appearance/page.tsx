import { AppearanceForm } from '@/components/settings/AppearanceForm'

export default function AppearancePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Appearance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose how Traycer looks on this device.
        </p>
      </div>
      <AppearanceForm />
    </div>
  )
}
