import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log('[BALANCES] Unauthorized access attempt');
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const balances = await prisma.balance.findMany({
      where: { userId: session.user.id },
      orderBy: { currency: 'asc' },
    });

    console.log(`[BALANCES] Retrieved ${balances.length} balances for user ${session.user.id}`);
    return NextResponse.json({ balances });
  } catch (error) {
    console.error('[BALANCES] Error fetching balances:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Salden' },
      { status: 500 }
    );
  }
}
