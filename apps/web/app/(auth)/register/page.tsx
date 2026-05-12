'use client'

import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
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

const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(values: RegisterValues) {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        password: values.password,
      }),
    })

    if (!response.ok) {
      setError('root', {
        message: 'Registration failed. Check the form and try again.',
      })
      return
    }

    await signIn('credentials', {
      email: 'dev@traycer.ai',
      password: 'password',
      redirectTo: '/projects',
    })
  }

  return (
    <Card className="w-full max-w-md border-zinc-800 bg-zinc-950 text-zinc-50 shadow-2xl">
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl">Create your account</CardTitle>
        <CardDescription className="text-zinc-400">
          Start with a local development account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {errors.root && (
          <div className="rounded-md border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-200">
            {errors.root.message}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-zinc-200">
              Name
            </Label>
            <Input
              id="name"
              autoComplete="name"
              className="border-zinc-800 bg-zinc-900"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-red-300">{errors.name.message}</p>
            )}
          </div>

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
              autoComplete="new-password"
              className="border-zinc-800 bg-zinc-900"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-red-300">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-zinc-200">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="border-zinc-800 bg-zinc-900"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-300">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-zinc-50 underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
