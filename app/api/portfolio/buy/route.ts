import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const startTime = Date.now();
  console.log('[BUY] Starting buy operation');
  
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log('[BUY] Unauthorized access attempt');
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const userId = session.user.id;
    const { symbol, assetType, quantity, price, currency } = await req.json();

    console.log('[BUY] Request data:', { userId, symbol, assetType, quantity, price, currency });

    if (!symbol || !assetType || !quantity || !price || !currency) {
      console.log('[BUY] Missing required fields');
      return NextResponse.json(
        { error: 'Всі поля обов\'язкові' },
        { status: 400 }
      );
    }

    const totalAmount = quantity * price;
    console.log('[BUY] Total amount:', totalAmount);

    // Execute all operations in a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Check if user has enough balance
      const balance = await tx.balance.findUnique({
        where: {
          userId_currency: {
            userId,
            currency,
          },
        },
      });

      console.log('[BUY] Current balance:', balance?.amount);

      if (!balance || balance.amount < totalAmount) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      // Update or create portfolio entry
      const existingPortfolio = await tx.portfolio.findUnique({
        where: {
          userId_symbol: {
            userId,
            symbol,
          },
        },
      });

      console.log('[BUY] Existing portfolio:', existingPortfolio?.quantity);

      if (existingPortfolio) {
        // Update existing position
        const newQuantity = existingPortfolio.quantity + quantity;
        const newAveragePrice =
          (existingPortfolio.quantity * existingPortfolio.averageBuyPrice +
            quantity * price) /
          newQuantity;

        await tx.portfolio.update({
          where: {
            userId_symbol: {
              userId,
              symbol,
            },
          },
          data: {
            quantity: newQuantity,
            averageBuyPrice: newAveragePrice,
          },
        });
        console.log('[BUY] Updated portfolio. New quantity:', newQuantity);
      } else {
        // Create new position
        await tx.portfolio.create({
          data: {
            userId,
            symbol,
            assetType,
            quantity,
            averageBuyPrice: price,
            currency,
          },
        });
        console.log('[BUY] Created new portfolio entry');
      }

      // Deduct from balance
      const newBalance = balance.amount - totalAmount;
      await tx.balance.update({
        where: {
          userId_currency: {
            userId,
            currency,
          },
        },
        data: {
          amount: newBalance,
        },
      });
      console.log('[BUY] Updated balance. New balance:', newBalance);

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: 'BUY',
          symbol,
          assetType,
          quantity,
          price,
          totalAmount,
          currency,
        },
      });
      console.log('[BUY] Created transaction record with ID:', transaction.id);

      return { success: true, transactionId: transaction.id };
    });

    const duration = Date.now() - startTime;
    console.log(`[BUY] ✅ Operation completed successfully in ${duration}ms. Transaction ID: ${result.transactionId}`);

    return NextResponse.json(
      { message: 'Kauf erfolgreich', transactionId: result.transactionId },
      { status: 200 }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[BUY] ❌ Error after ${duration}ms:`, error);
    
    if (error.message === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json(
        { error: 'Nicht genügend Guthaben' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Fehler beim Kauf', details: error.message },
      { status: 500 }
    );
  }
}
