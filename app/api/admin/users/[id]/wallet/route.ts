import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH - Оновлення wallet address адміном
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Zugriff verweigert - Admin-Rechte erforderlich' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { walletAddress } = body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { walletAddress: walletAddress || null },
      select: {
        id: true,
        email: true,
        walletAddress: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      user: updatedUser,
      message: 'Wallet-Adresse erfolgreich aktualisiert' 
    });
  } catch (error) {
    console.error('Error updating wallet address:', error);
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Wallet-Adresse' },
      { status: 500 }
    );
  }
}
