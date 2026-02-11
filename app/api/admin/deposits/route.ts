import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Admin creates a deposit/transfer entry for a user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Verify admin role
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (adminUser?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nur für Administratoren' }, { status: 403 });
    }

    const { 
      userId, 
      type,
      amount, 
      currency,
      recipientName,
      iban,
      status,
      createdAt
    } = await request.json();

    // Validate required fields
    if (!userId || !type || !amount || !currency || !status) {
      return NextResponse.json({ error: 'Alle Pflichtfelder ausfüllen' }, { status: 400 });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    // Parse date or use current date
    let transactionDate = new Date();
    if (createdAt) {
      transactionDate = new Date(createdAt);
    }

    // Create the transfer entry
    const transfer = await prisma.transfer.create({
      data: {
        userId,
        type: type as 'FIAT' | 'CRYPTO',
        amount: parseFloat(amount),
        currency,
        recipientName: recipientName || null,
        iban: iban || null,
        status: status as 'PENDING' | 'APPROVED' | 'REJECTED',
        createdAt: transactionDate,
      }
    });

    return NextResponse.json({ 
      success: true,
      transfer
    });

  } catch (error) {
    console.error('Admin deposit error:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
