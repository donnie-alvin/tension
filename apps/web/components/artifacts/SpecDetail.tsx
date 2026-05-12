import { Spec } from '@traycer/shared'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'

interface SpecDetailProps {
  spec: Spec
}

export function SpecDetail({ spec }: SpecDetailProps) {
  return <MarkdownRenderer content={spec.content} />
}
