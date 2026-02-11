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
        console.log('[AUTH] Starting authorization...');
        console.log('[AUTH] Email:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials');
          throw new Error('Email und Passwort erforderlich');
        }

        try {
          console.log('[AUTH] Looking up user in database...');
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          console.log('[AUTH] User found:', user ? 'yes' : 'no');

          if (!user) {
            console.log('[AUTH] User not found');
            throw new Error('Falsche E-Mail oder Passwort');
          }

          // Check if this is an admin impersonation request
          if (credentials.adminImpersonate === 'true') {
            console.log('[AUTH] Admin impersonation request');
            try {
              const decoded = jwt.verify(
                credentials.password,
                process.env.NEXTAUTH_SECRET || 'secret'
              ) as { userId: string; email: string; impersonatedBy: string };

              if (decoded.email === credentials.email && decoded.impersonatedBy) {
                console.log('[AUTH] Impersonation successful');
                return {
                  id: user.id,
                  email: user.email,
                  name: user.name,
                  role: user.role,
                };
              }
            } catch (e) {
              console.log('[AUTH] Impersonation token invalid:', e);
              throw new Error('Ungültiger Admin-Token');
            }
          }

          console.log('[AUTH] Comparing passwords...');
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          console.log('[AUTH] Password valid:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('[AUTH] Invalid password');
            throw new Error('Falsche E-Mail oder Passwort');
          }

          console.log('[AUTH] Login successful for:', user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('[AUTH] Error during authorization:', error);
          throw error;
        }
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
  debug: process.env.NODE_ENV === 'development',
};
