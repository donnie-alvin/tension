import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import GitHub from 'next-auth/providers/github'
import { z } from 'zod'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials)

        if (!parsed.success) {
          return null
        }

        if (
          parsed.data.email === 'dev@traycer.ai' &&
          parsed.data.password === 'password'
        ) {
          return {
            id: 'dev-user',
            name: 'Traycer Dev',
            email: parsed.data.email,
            image: null,
          }
        }

        return null
      },
    }),
    GitHub({
      clientId: process.env.GITHUB_ID ?? process.env.AUTH_GITHUB_ID ?? '',
      clientSecret:
        process.env.GITHUB_SECRET ?? process.env.AUTH_GITHUB_SECRET ?? '',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
})
