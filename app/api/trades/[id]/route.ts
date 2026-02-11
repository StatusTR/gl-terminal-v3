import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// PATCH - User closes their own trade (gets back original amount only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    const { id } = await params;

    // Find the trade
    const trade = await prisma.trade.findUnique({
      where: { id }
    });

    if (!trade) {
      return NextResponse.json({ error: 'Handel nicht gefunden' }, { status: 404 });
    }

    if (trade.userId !== user.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    if (trade.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Handel ist bereits geschlossen' }, { status: 400 });
    }

    // Close trade and return original amount to balance
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Return original amount to balance
      await tx.balance.upsert({
        where: {
          userId_currency: {
            userId: user.id,
            currency: trade.currency
          }
        },
        update: { amount: { increment: trade.amount } },
        create: {
          userId: user.id,
          currency: trade.currency,
          amount: trade.amount
        }
      });

      // Update trade status
      const updatedTrade = await tx.trade.update({
        where: { id },
        data: {
          status: 'CLOSED_BY_USER',
          profit: 0,
          profitPercent: 0,
          closedAt: new Date()
        }
      });

      return updatedTrade;
    });

    return NextResponse.json({ success: true, trade: result });
  } catch (error) {
    console.error('Error closing trade:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
