import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Portfolio des Benutzers abrufen
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = params;

    const portfolio = await prisma.portfolio.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ portfolio });
  } catch (error) {
    console.error('[ADMIN_PORTFOLIO_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Vermögenswert im Portfolio hinzufügen oder aktualisieren
export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = params;
    const body = await req.json();
    const { symbol, quantity, averageBuyPrice } = body;

    // Validierung
    if (!symbol || typeof quantity !== 'number' || typeof averageBuyPrice !== 'number') {
      return NextResponse.json(
        { error: 'Invalid data: symbol, quantity, and averageBuyPrice are required' },
        { status: 400 }
      );
    }

    if (quantity < 0 || averageBuyPrice < 0) {
      return NextResponse.json(
        { error: 'Quantity and price must be positive' },
        { status: 400 }
      );
    }

    // Prüfen, ob Benutzer existiert
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Wenn quantity = 0, Vermögenswert entfernen
    if (quantity === 0) {
      await prisma.portfolio.deleteMany({
        where: {
          userId,
          symbol,
        },
      });

      console.log(`[ADMIN_PORTFOLIO] Deleted ${symbol} from user ${userId}`);

      return NextResponse.json({
        message: 'Asset removed from portfolio',
        symbol,
      });
    }

    // Vermögenswerttyp bestimmen (CRYPTO oder STOCK)
    const assetType = symbol.match(/^(BTC|ETH|USDC|LTC|XRP|ADA|BNB|SOL|DOGE|XMR|LINK|SHIB|AVAX|XLM|NEAR|DOT)$/) 
      ? 'CRYPTO' 
      : 'STOCK';

    // Vermögenswert erstellen oder aktualisieren
    const portfolioItem = await prisma.portfolio.upsert({
      where: {
        userId_symbol: {
          userId,
          symbol,
        },
      },
      update: {
        quantity,
        averageBuyPrice,
      },
      create: {
        userId,
        symbol,
        assetType,
        quantity,
        averageBuyPrice,
      },
    });

    console.log(`[ADMIN_PORTFOLIO] Updated ${symbol} for user ${userId}: ${quantity} @ ${averageBuyPrice}`);

    return NextResponse.json({
      message: 'Portfolio updated successfully',
      portfolioItem,
    });
  } catch (error) {
    console.error('[ADMIN_PORTFOLIO_POST]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Vermögenswert aus Portfolio entfernen
export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = params;
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    await prisma.portfolio.deleteMany({
      where: {
        userId,
        symbol,
      },
    });

    console.log(`[ADMIN_PORTFOLIO] Deleted ${symbol} from user ${userId}`);

    return NextResponse.json({
      message: 'Asset removed from portfolio',
      symbol,
    });
  } catch (error) {
    console.error('[ADMIN_PORTFOLIO_DELETE]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
