import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// PATCH - Admin closes a trade with profit
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nur für Administratoren' }, { status: 403 });
    }

    const { id } = params;
    const { profit, tradingPair, adminComment } = await request.json();

    // Find the trade
    const trade = await prisma.trade.findUnique({
      where: { id }
    });

    if (!trade) {
      return NextResponse.json({ error: 'Handel nicht gefunden' }, { status: 404 });
    }

    if (trade.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Handel ist bereits geschlossen' }, { status: 400 });
    }

    const profitAmount = parseFloat(profit) || 0;
    const profitPercent = (profitAmount / trade.amount) * 100;
    const totalReturn = trade.amount + profitAmount;

    // Close trade and add total to balance
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Add total (original + profit) to balance
      await tx.balance.upsert({
        where: {
          userId_currency: {
            userId: trade.userId,
            currency: trade.currency
          }
        },
        update: { amount: { increment: totalReturn } },
        create: {
          userId: trade.userId,
          currency: trade.currency,
          amount: totalReturn
        }
      });

      // Update trade
      const updatedTrade = await tx.trade.update({
        where: { id },
        data: {
          status: 'CLOSED_BY_ADMIN',
          profit: profitAmount,
          profitPercent: profitPercent,
          tradingPair: tradingPair || null,
          adminComment: adminComment || null,
          closedAt: new Date()
        }
      });

      return updatedTrade;
    });

    return NextResponse.json({ success: true, trade: result });
  } catch (error) {
    console.error('Error closing trade by admin:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
