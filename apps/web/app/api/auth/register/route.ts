import { NextResponse } from 'next/server'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(request: Request) {
  const body: unknown = await request.json()
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: 'Invalid registration payload' },
      { status: 400 },
    )
  }

  return NextResponse.json(
    {
      user: {
        id: 'mock-id',
        name: parsed.data.name,
        email: parsed.data.email,
      },
    },
    { status: 201 },
  )
}
