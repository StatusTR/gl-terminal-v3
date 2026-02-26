import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// PATCH - Update admin (only SUPER_ADMIN)
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

    const { name, password, adminIcon } = await req.json();

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (adminIcon !== undefined) updateData.adminIcon = adminIcon;
    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedAdmin = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        adminIcon: true
      }
    });

    return NextResponse.json({ admin: updatedAdmin, message: 'Administrator aktualisiert' });
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}

// DELETE - Delete admin (only SUPER_ADMIN)
export async function DELETE(
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

    // Cannot delete yourself
    if (currentUser.id === id) {
      return NextResponse.json({ error: 'Sie können sich selbst nicht löschen' }, { status: 400 });
    }

    // Check if admin exists and is not SUPER_ADMIN
    const adminToDelete = await prisma.user.findUnique({
      where: { id }
    });

    if (!adminToDelete) {
      return NextResponse.json({ error: 'Administrator nicht gefunden' }, { status: 404 });
    }

    if (adminToDelete.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Hauptadministrator kann nicht gelöscht werden' }, { status: 400 });
    }

    // Unassign all clients before deleting
    await prisma.user.updateMany({
      where: { assignedAdminId: id },
      data: { assignedAdminId: null }
    });

    // Delete admin
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: 'Administrator erfolgreich gelöscht' });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
