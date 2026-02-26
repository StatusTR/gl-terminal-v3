import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { ADMIN_ICONS } from '@/lib/admin-icons';

export const dynamic = 'force-dynamic';

// GET - List all admins (only SUPER_ADMIN can access)
export async function GET() {
  try {
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

    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        adminIcon: true,
        createdAt: true,
        _count: {
          select: {
            managedClients: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ admins, icons: ADMIN_ICONS });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}

// POST - Create new admin (only SUPER_ADMIN can access)
export async function POST(req: NextRequest) {
  try {
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

    const { email, password, name, adminIcon } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-Mail und Passwort sind erforderlich' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'E-Mail wird bereits verwendet' }, { status: 400 });
    }

    // Create admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: 'ADMIN',
        adminIcon: adminIcon || null
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        adminIcon: true,
        createdAt: true
      }
    });

    return NextResponse.json({ admin: newAdmin, message: 'Administrator erfolgreich erstellt' });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
  }
}
