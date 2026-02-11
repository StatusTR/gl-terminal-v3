import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  console.log('[ADMIN_TRANSFER_UPDATE] Starting update operation');
  
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 });
    }

    const { id } = params;
    const { status } = await request.json();

    console.log('[ADMIN_TRANSFER_UPDATE] Updating transfer:', { id, status });

    if (!['PENDING', 'COMPLETED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Ungültiger Status' },
        { status: 400 }
      );
    }

    // Execute update in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const transfer = await tx.transfer.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!transfer) {
        throw new Error('TRANSFER_NOT_FOUND');
      }

      console.log('[ADMIN_TRANSFER_UPDATE] Current status:', transfer.status);

      // If rejecting a FIAT transfer that was PENDING, refund the balance
      if (
        status === 'REJECTED' &&
        transfer.status === 'PENDING' &&
        transfer.type === 'FIAT' &&
        transfer.currency
      ) {
        const balance = await tx.balance.findUnique({
          where: {
            userId_currency: {
              userId: transfer.userId,
              currency: transfer.currency,
            },
          },
        });

        if (balance) {
          await tx.balance.update({
            where: {
              userId_currency: {
                userId: transfer.userId,
                currency: transfer.currency,
              },
            },
            data: {
              amount: balance.amount + transfer.amount,
            },
          });
          console.log('[ADMIN_TRANSFER_UPDATE] Balance refunded:', transfer.amount);
        }
      }

      // Update transfer status
      const updatedTransfer = await tx.transfer.update({
        where: { id },
        data: { status },
      });

      console.log('[ADMIN_TRANSFER_UPDATE] Transfer updated to status:', status);
      return updatedTransfer;
    });

    const duration = Date.now() - startTime;
    console.log(`[ADMIN_TRANSFER_UPDATE] ✅ Operation completed in ${duration}ms`);

    return NextResponse.json({
      message: 'Überweisungsstatus aktualisiert',
      transfer: result,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[ADMIN_TRANSFER_UPDATE] ❌ Error after ${duration}ms:`, error);
    
    if (error.message === 'TRANSFER_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Überweisung nicht gefunden' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Überweisung', details: error.message },
      { status: 500 }
    );
  }
}
