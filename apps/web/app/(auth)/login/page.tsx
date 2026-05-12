'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Github, Loader2 } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginValues = z.infer<typeof loginSchema>

function LoginForm() {
  const searchParams = useSearchParams()
  const authError = searchParams.get('error')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'dev@traycer.ai',
      password: 'password',
    },
  })

  async function onSubmit(values: LoginValues) {
    await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirectTo: '/projects',
    })
  }

  return (
    <Card className="w-full max-w-md border-zinc-800 bg-zinc-950 text-zinc-50 shadow-2xl">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl">Sign in to Traycer</CardTitle>
        <CardDescription className="text-zinc-400">
          Use the development account or connect with GitHub.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {authError && (
          <div className="rounded-md border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-200">
            Authentication failed. Check your credentials and try again.
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-200">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className="border-zinc-800 bg-zinc-900"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-300">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-200">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              className="border-zinc-800 bg-zinc-900"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-300">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          className="w-full border-zinc-800 bg-zinc-950 text-zinc-50 hover:bg-zinc-900 hover:text-zinc-50"
          onClick={() => void signIn('github', { redirectTo: '/projects' })}
        >
          <Github className="mr-2 h-4 w-4" />
          Continue with GitHub
        </Button>

        <p className="text-center text-sm text-zinc-400">
          No account?{' '}
          <Link href="/register" className="font-medium text-zinc-50 underline">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[420px] w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950" />
      }
    >
      <LoginForm />
    </Suspense>
  )
}
