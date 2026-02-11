import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Отримати wallet address користувача
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        walletAddress: true,
      },
    });

    return NextResponse.json({ 
      walletAddress: user?.walletAddress || null 
    });
  } catch (error) {
    console.error('Error fetching wallet address:', error);
    return NextResponse.json(
      { error: 'Fehler beim Laden der Wallet-Adresse' },
      { status: 500 }
    );
  }
}

// PATCH - Оновити wallet address (імпорт користувачем)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { walletAddress } = body;

    // Базова валідація wallet address
    if (walletAddress && typeof walletAddress === 'string') {
      const trimmed = walletAddress.trim();
      
      // Перевірка довжини (EVM addresses = 42, BTC = 26-35, etc)
      if (trimmed.length > 0 && (trimmed.length < 20 || trimmed.length > 100)) {
        return NextResponse.json(
          { error: 'Ungültige Wallet-Adresse' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: { walletAddress: walletAddress?.trim() || null },
      select: {
        walletAddress: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      walletAddress: updatedUser.walletAddress,
      message: 'Wallet-Adresse erfolgreich importiert' 
    });
  } catch (error) {
    console.error('Error updating wallet address:', error);
    return NextResponse.json(
      { error: 'Fehler beim Importieren der Wallet-Adresse' },
      { status: 500 }
    );
  }
}
