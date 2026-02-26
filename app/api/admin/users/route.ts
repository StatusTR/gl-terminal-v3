export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current user with role
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    // Check if user is admin
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

    // Paginierungsparameter aus URL abrufen
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const search = searchParams.get('search') || '';

    // Offset berechnen
    const skip = (page - 1) * limit;

    // Suchbedingungen - ADMIN sees only their assigned clients, SUPER_ADMIN sees all
    const baseWhere: any = {
      role: 'USER' // Only show regular users, not admins
    };

    // Regular ADMIN only sees their assigned clients
    if (!isSuperAdmin) {
      baseWhere.assignedAdminId = currentUser.id;
    }

    const where = search
      ? {
          AND: [
            baseWhere,
            {
              OR: [
                { email: { contains: search, mode: 'insensitive' as const } },
                { name: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          ]
        }
      : baseWhere;

    // Gesamtzahl der Benutzer abrufen
    const totalUsers = await prisma.user.count({ where });

    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        accountNumber: true,
        recipientName: true,
        iban: true,
        paymentPurpose: true,
        bic: true,
        bankAddress: true,
        walletAddress: true,
        assignedAdminId: true,
        assignedAdmin: {
          select: {
            id: true,
            email: true,
            name: true,
            adminIcon: true
          }
        },
        createdAt: true,
        balances: {
          select: {
            currency: true,
            amount: true,
          },
        },
        _count: {
          select: {
            portfolio: true,
            transactions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      users,
      currentAdmin: {
        id: currentUser.id,
        role: currentUser.role,
        isSuperAdmin
      },
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
