import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH - Assign user to admin (only SUPER_ADMIN)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (currentUser?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Nur Hauptadministrator hat Zugriff' }, { status: 403 });
    }

    const { adminId } = await req.json();

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    if (user.role !== 'USER') {
      return NextResponse.json({ error: 'Nur Benutzer können zugewiesen werden' }, { status: 400 });
    }

    // If adminId is provided, verify admin exists
    if (adminId) {
      const admin = await prisma.user.findUnique({ where: { id: adminId } });
      if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Administrator nicht gefunden' }, { status: 404 });
      }
    }

    // Update user assignment
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { assignedAdminId: adminId || null },
      select: {
        id: true,
        email: true,
        assignedAdminId: true,
        assignedAdmin: {
          select: {
            id: true,
            email: true,
            name: true,
            adminIcon: true
          }
        }
      }
    });

    return NextResponse.json({ 
      user: updatedUser, 
      message: adminId ? 'Benutzer erfolgreich zugewiesen' : 'Zuweisung aufgehoben' 
    });
  } catch (error) {
    console.error('Error assigning user:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
