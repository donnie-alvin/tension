'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { routes } from '@traycer/shared'
import { SpecDetail } from '@/components/artifacts/SpecDetail'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSpec } from '@/lib/queries/artifacts'

interface SpecPageProps {
  params: Promise<{
    projectId: string
    specId: string
  }>
}

export default function SpecPage({ params }: SpecPageProps) {
  const { projectId, specId } = use(params)
  const spec = useSpec(specId)

  if (spec.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  if (!spec.data) {
    return <p className="text-sm text-muted-foreground">Spec not found.</p>
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="px-0">
        <Link href={`${routes.artifacts(projectId)}?tab=specs`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to artifacts
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          {spec.data.title}
        </h1>
      </div>
      <SpecDetail spec={spec.data} />
    </div>
  )
}
