import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Währungswechselkurse (inkl. USDC Stablecoin)
const exchangeRates: Record<string, Record<string, number>> = {
  EUR: { USD: 1.09, GBP: 0.86, CHF: 0.95, USDC: 1.09 },
  USD: { EUR: 0.92, GBP: 0.79, CHF: 0.87, USDC: 1.00 },
  GBP: { EUR: 1.17, USD: 1.27, CHF: 1.10, USDC: 1.27 },
  CHF: { EUR: 1.05, USD: 1.15, GBP: 0.91, USDC: 1.15 },
  USDC: { EUR: 0.92, USD: 1.00, GBP: 0.79, CHF: 0.87 },
};

export async function POST(req: Request) {
  const startTime = Date.now();
  console.log('[CONVERT] Starting currency conversion');

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log('[CONVERT] Unauthorized access attempt');
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { fromCurrency, toCurrency, amount } = body;

    console.log('[CONVERT] Request:', { userId, fromCurrency, toCurrency, amount });

    // Validierung
    if (!fromCurrency || !toCurrency || !amount) {
      return NextResponse.json(
        { error: 'Всі поля обов\'язкові' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Betrag muss größer als 0 sein' },
        { status: 400 }
      );
    }

    if (fromCurrency === toCurrency) {
      return NextResponse.json(
        { error: 'Wählen Sie verschiedene Währungen' },
        { status: 400 }
      );
    }

    const validCurrencies = ['EUR', 'USD', 'GBP', 'CHF', 'USDC'];
    if (!validCurrencies.includes(fromCurrency) || !validCurrencies.includes(toCurrency)) {
      return NextResponse.json(
        { error: 'Ungültige Währung' },
        { status: 400 }
      );
    }

    // Konvertierung in einer Transaktion durchführen
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Saldo der Ausgangswährung abrufen
      const fromBalance = await tx.balance.findUnique({
        where: {
          userId_currency: {
            userId,
            currency: fromCurrency,
          },
        },
      });

      if (!fromBalance || fromBalance.amount < amount) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      // Konvertierten Betrag berechnen
      const rate = exchangeRates[fromCurrency]?.[toCurrency] ?? 1;
      const convertedAmount = amount * rate;

      console.log('[CONVERT] Exchange rate:', rate, 'Converted amount:', convertedAmount);

      // Saldo der Ausgangswährung verringern
      await tx.balance.update({
        where: {
          userId_currency: {
            userId,
            currency: fromCurrency,
          },
        },
        data: {
          amount: fromBalance.amount - amount,
        },
      });

      // Saldo der Zielwährung erhöhen (oder erstellen, falls nicht vorhanden)
      await tx.balance.upsert({
        where: {
          userId_currency: {
            userId,
            currency: toCurrency,
          },
        },
        update: {
          amount: {
            increment: convertedAmount,
          },
        },
        create: {
          userId,
          currency: toCurrency,
          amount: convertedAmount,
        },
      });

      console.log('[CONVERT] Balances updated successfully');

      return {
        fromAmount: amount,
        toAmount: convertedAmount,
        rate,
      };
    });

    const duration = Date.now() - startTime;
    console.log(`[CONVERT] ✅ Conversion completed in ${duration}ms`);

    return NextResponse.json(
      {
        message: 'Umtausch erfolgreich',
        ...result,
      },
      { status: 200 }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[CONVERT] ❌ Error after ${duration}ms:`, error);

    if (error.message === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json(
        { error: 'Nicht genügend Guthaben' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Fehler beim Umtausch', details: error.message },
      { status: 500 }
    );
  }
}
