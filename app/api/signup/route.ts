import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const startTime = Date.now();
  console.log('[SIGNUP] Starting signup operation');
  
  try {
    const { email, password, confirmPassword } = await req.json();

    console.log('[SIGNUP] Request data:', { email });

    if (!email || !password) {
      console.log('[SIGNUP] Missing email or password');
      return NextResponse.json(
        { error: 'Email та пароль обов\'язкові' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      console.log('[SIGNUP] Passwords do not match');
      return NextResponse.json(
        { error: 'Passwörter stimmen nicht überein' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      console.log('[SIGNUP] Password too short');
      return NextResponse.json(
        { error: 'Passwort muss mindestens 6 Zeichen enthalten' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('[SIGNUP] User already exists');
      return NextResponse.json(
        { error: 'Benutzer mit dieser E-Mail existiert bereits' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Use transaction to ensure user and balances are created atomically
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
        },
      });

      console.log('[SIGNUP] Created user with ID:', user.id);

      // Create initial balances with zero amounts
      await tx.balance.createMany({
        data: [
          { userId: user.id, currency: 'EUR', amount: 0 },
          { userId: user.id, currency: 'USD', amount: 0 },
          { userId: user.id, currency: 'GBP', amount: 0 },
          { userId: user.id, currency: 'CHF', amount: 0 },
        ],
      });

      console.log('[SIGNUP] Created initial balances for user:', user.id);

      return { userId: user.id };
    });

    const duration = Date.now() - startTime;
    console.log(`[SIGNUP] ✅ Registration completed successfully in ${duration}ms. User ID: ${result.userId}`);

    return NextResponse.json(
      { message: 'Registrierung erfolgreich', userId: result.userId },
      { status: 201 }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[SIGNUP] ❌ Error after ${duration}ms:`, error);
    return NextResponse.json(
      { error: 'Fehler bei der Registrierung', details: error.message },
      { status: 500 }
    );
  }
}
