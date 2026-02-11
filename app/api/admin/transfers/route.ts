import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const whereClause: any = {};
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const transfers = await prisma.transfer.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    console.log(`[ADMIN_TRANSFERS] Retrieved ${transfers.length} transfers`);
    return NextResponse.json({ transfers });
  } catch (error) {
    console.error('[ADMIN_TRANSFERS] Error fetching transfers:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Überweisungen' },
      { status: 500 }
    );
  }
}
