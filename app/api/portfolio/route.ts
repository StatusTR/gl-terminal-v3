import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log('[PORTFOLIO] Unauthorized access attempt');
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const portfolio = await prisma.portfolio.findMany({
      where: { userId: session.user.id },
      orderBy: { symbol: 'asc' },
    });

    console.log(`[PORTFOLIO] Retrieved ${portfolio.length} items for user ${session.user.id}`);
    return NextResponse.json({ portfolio });
  } catch (error) {
    console.error('[PORTFOLIO] Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Portfolios' },
      { status: 500 }
    );
  }
}
