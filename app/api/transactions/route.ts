import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log('[TRANSACTIONS] Unauthorized access attempt');
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    console.log(`[TRANSACTIONS] Retrieved ${transactions.length} transactions for user ${session.user.id}`);
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('[TRANSACTIONS] Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Transaktionen' },
      { status: 500 }
    );
  }
}
