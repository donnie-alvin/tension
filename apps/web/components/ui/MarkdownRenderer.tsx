'use client'

import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
}

const components: Components = {
  pre({ children }) {
    return (
      <pre className="overflow-x-auto rounded-lg bg-muted p-4">
        {children}
      </pre>
    )
  },
  code({ node, className, children, ...props }) {
    const isBlock =
      Boolean(node) &&
      typeof className === 'string' &&
      className.startsWith('language-')

    return (
      <code
        className={cn(
          isBlock
            ? 'font-mono text-sm'
            : 'rounded bg-muted px-1 py-0.5 font-mono text-sm',
          className,
        )}
        {...props}
      >
        {children}
      </code>
    )
  },
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-zinc max-w-none dark:prose-invert">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
