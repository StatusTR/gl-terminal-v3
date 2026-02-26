import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        adminImpersonate: { label: 'Admin Impersonate', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email та пароль обов\'язкові');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('Невірний email або пароль');
        }

        // Check if this is an admin impersonation request
        if (credentials.adminImpersonate === 'true') {
          try {
            // Verify the admin token
            const decoded = jwt.verify(
              credentials.password,
              process.env.NEXTAUTH_SECRET || 'secret'
            ) as { userId: string; email: string; impersonatedBy: string };

            // Verify the token is for this user
            if (decoded.email === credentials.email && decoded.impersonatedBy) {
              return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
              };
            }
          } catch {
            throw new Error('Ungültiger Admin-Token');
          }
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Невірний email або пароль');
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
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
