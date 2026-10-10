import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      const sessionUser = session.user as { id?: string; role?: string } | undefined;

      if (sessionUser) {
        sessionUser.id = token.sub ?? sessionUser.id ?? '';
        sessionUser.role = (token.role as string | undefined) ?? sessionUser.role ?? 'candidate';
      }

      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? 'candidate';
      }

      if (token.sub) {
        const databaseUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        });

        if (databaseUser?.role) {
          token.role = databaseUser.role;
        }
      }

      return token;
    },
  },
};

export type AppSessionUser = {
  id?: string;
  role?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};
