import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET - Fetch user's trades
export async function GET() {
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

    const trades = await prisma.trade.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ trades });
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}

// POST - Create a new trade (user starts trading)
export async function POST(request: NextRequest) {
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

    const { amount, currency } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Ungültiger Betrag' }, { status: 400 });
    }

    if (!currency) {
      return NextResponse.json({ error: 'Währung erforderlich' }, { status: 400 });
    }

    // Check if user has active trade
    const activeTrade = await prisma.trade.findFirst({
      where: { userId: user.id, status: 'ACTIVE' }
    });

    if (activeTrade) {
      return NextResponse.json({ error: 'Sie haben bereits eine aktive Handelsposition' }, { status: 400 });
    }

    // Check balance
    const balance = await prisma.balance.findFirst({
      where: { userId: user.id, currency }
    });

    if (!balance || balance.amount < amount) {
      return NextResponse.json({ error: 'Unzureichendes Guthaben' }, { status: 400 });
    }

    // Create trade and deduct from balance in transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Deduct from balance
      await tx.balance.update({
        where: { id: balance.id },
        data: { amount: { decrement: amount } }
      });

      // Create trade
      const trade = await tx.trade.create({
        data: {
          userId: user.id,
          amount,
          currency,
          status: 'ACTIVE'
        }
      });

      return trade;
    });

    return NextResponse.json({ success: true, trade: result });
  } catch (error) {
    console.error('Error creating trade:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
