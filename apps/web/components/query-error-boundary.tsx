'use client'

import { Component, type ReactNode } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface QueryErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface QueryErrorBoundaryState {
  error: Error | null
}

export class QueryErrorBoundary extends Component<
  QueryErrorBoundaryProps,
  QueryErrorBoundaryState
> {
  state: QueryErrorBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(error: Error): QueryErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error) {
    if (error instanceof ApiError) {
      toast.error(error.message, {
        description: `${error.code} (${error.status})`,
      })
      return
    }

    toast.error('Something went wrong')
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle>Unable to load data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {this.state.error.message}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
