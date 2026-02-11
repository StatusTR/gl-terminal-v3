import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Get user's transfers
export async function GET() {
  const startTime = Date.now();
  console.log('[TRANSFERS] Starting get transfers operation');
  
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log('[TRANSFERS] Unauthorized access attempt');
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const transfers = await prisma.transfer.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100, // Begrenzung für Performance
    });

    const duration = Date.now() - startTime;
    console.log(`[TRANSFERS] Retrieved ${transfers.length} transfers in ${duration}ms`);
    
    return NextResponse.json({ transfers });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[TRANSFERS] ❌ Error after ${duration}ms:`, error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Überweisungen', details: error.message },
      { status: 500 }
    );
  }
}

// Create a new transfer
export async function POST(req: Request) {
  const startTime = Date.now();
  console.log('[TRANSFERS] Starting create transfer operation');
  
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      console.log('[TRANSFERS] Unauthorized access attempt');
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { type, amount, currency, recipient, iban, purpose, cryptoAddress, cryptoCurrency } = body;

    console.log('[TRANSFERS] Request data:', { userId, type, amount });

    if (!type || !amount) {
      console.log('[TRANSFERS] Missing required fields');
      return NextResponse.json(
        { error: 'Тип та сума обов\'язкові' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Betrag muss größer als 0 sein' },
        { status: 400 }
      );
    }

    // Validate fields based on transfer type
    if (type === 'FIAT') {
      if (!currency || !recipient || !iban) {
        return NextResponse.json(
          { error: 'Für Fiat-Überweisung erforderlich: Währung, Empfänger, IBAN' },
          { status: 400 }
        );
      }
    } else if (type === 'CRYPTO') {
      if (!cryptoAddress || !cryptoCurrency) {
        return NextResponse.json(
          { error: 'Für Krypto-Überweisung erforderlich: Adresse, Kryptowährung' },
          { status: 400 }
        );
      }
    }

    // Execute transfer creation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check balance for fiat transfers
      if (type === 'FIAT' && currency) {
        const balance = await tx.balance.findUnique({
          where: {
            userId_currency: {
              userId,
              currency,
            },
          },
        });

        console.log('[TRANSFERS] Current balance:', balance?.amount);

        if (!balance || balance.amount < amount) {
          throw new Error('INSUFFICIENT_FUNDS');
        }

        // Deduct from balance
        await tx.balance.update({
          where: {
            userId_currency: {
              userId,
              currency,
            },
          },
          data: {
            amount: balance.amount - amount,
          },
        });
        console.log('[TRANSFERS] Balance updated. New balance:', balance.amount - amount);
      }

      // Create transfer record
      const transfer = await tx.transfer.create({
        data: {
          userId,
          type,
          amount,
          status: 'PENDING',
          currency: type === 'FIAT' ? currency : null,
          recipient: type === 'FIAT' ? recipient : null,
          iban: type === 'FIAT' ? iban : null,
          purpose: type === 'FIAT' ? purpose : null,
          cryptoAddress: type === 'CRYPTO' ? cryptoAddress : null,
          cryptoCurrency: type === 'CRYPTO' ? cryptoCurrency : null,
        },
      });
      console.log('[TRANSFERS] Created transfer with ID:', transfer.id);

      return { transferId: transfer.id };
    });

    const duration = Date.now() - startTime;
    console.log(`[TRANSFERS] ✅ Transfer created successfully in ${duration}ms. Transfer ID: ${result.transferId}`);

    return NextResponse.json(
      { message: 'Überweisung erfolgreich erstellt', transferId: result.transferId },
      { status: 201 }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[TRANSFERS] ❌ Error after ${duration}ms:`, error);
    
    if (error.message === 'INSUFFICIENT_FUNDS') {
      return NextResponse.json(
        { error: 'Nicht genügend Guthaben' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Überweisung', details: error.message },
      { status: 500 }
    );
  }
}
