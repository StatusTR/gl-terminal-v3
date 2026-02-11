import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const startTime = Date.now();
  console.log('[SELL] Starting sell operation');
  
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log('[SELL] Unauthorized access attempt');
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const userId = session.user.id;
    const { symbol, quantity, price, currency } = await req.json();

    console.log('[SELL] Request data:', { userId, symbol, quantity, price, currency });

    if (!symbol || !quantity || !price || !currency) {
      console.log('[SELL] Missing required fields');
      return NextResponse.json(
        { error: 'Всі поля обов\'язкові' },
        { status: 400 }
      );
    }

    const totalAmount = quantity * price;
    console.log('[SELL] Total amount:', totalAmount);

    // Execute all operations in a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Check if user has the asset
      const portfolio = await tx.portfolio.findUnique({
        where: {
          userId_symbol: {
            userId,
            symbol,
          },
        },
      });

      console.log('[SELL] Current portfolio quantity:', portfolio?.quantity);

      if (!portfolio || portfolio.quantity < quantity) {
        throw new Error('INSUFFICIENT_ASSETS');
      }

      // Update portfolio
      const newQuantity = portfolio.quantity - quantity;
      if (newQuantity === 0) {
        await tx.portfolio.delete({
          where: {
            userId_symbol: {
              userId,
              symbol,
            },
          },
        });
        console.log('[SELL] Deleted portfolio entry (quantity reached 0)');
      } else {
        await tx.portfolio.update({
          where: {
            userId_symbol: {
              userId,
              symbol,
            },
          },
          data: {
            quantity: newQuantity,
          },
        });
        console.log('[SELL] Updated portfolio. New quantity:', newQuantity);
      }

      // Add to balance
      const balance = await tx.balance.findUnique({
        where: {
          userId_currency: {
            userId,
            currency,
          },
        },
      });

      console.log('[SELL] Current balance:', balance?.amount);

      if (balance) {
        const newBalance = balance.amount + totalAmount;
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
        console.log('[SELL] Updated balance. New balance:', newBalance);
      } else {
        await tx.balance.create({
          data: {
            userId,
            currency,
            amount: totalAmount,
          },
        });
        console.log('[SELL] Created new balance entry:', totalAmount);
      }

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: 'SELL',
          symbol,
          assetType: portfolio.assetType,
          quantity,
          price,
          totalAmount,
          currency,
        },
      });
      console.log('[SELL] Created transaction record with ID:', transaction.id);

      return { success: true, transactionId: transaction.id };
    });

    const duration = Date.now() - startTime;
    console.log(`[SELL] ✅ Operation completed successfully in ${duration}ms. Transaction ID: ${result.transactionId}`);

    return NextResponse.json(
      { message: 'Verkauf erfolgreich', transactionId: result.transactionId },
      { status: 200 }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[SELL] ❌ Error after ${duration}ms:`, error);
    
    if (error.message === 'INSUFFICIENT_ASSETS') {
      return NextResponse.json(
        { error: 'Nicht genug Vermögenswerte zum Verkauf' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Fehler beim Verkauf', details: error.message },
      { status: 500 }
    );
  }
}
