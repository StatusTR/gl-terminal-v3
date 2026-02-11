import { NextResponse } from 'next/server';
import { CRYPTOCURRENCIES, GERMAN_STOCKS, getAssetBySymbol } from '@/lib/assets';

export const dynamic = 'force-dynamic';

// Symbol in Yahoo Finance Format konvertieren
function convertToYahooSymbol(symbol: string): string {
  // Prüfen, ob es eine Kryptowährung ist
  const isCrypto = CRYPTOCURRENCIES.some(c => c.symbol === symbol);
  if (isCrypto) {
    // Für Kryptowährungen -USD hinzufügen
    return `${symbol}-USD`;
  }

  // Prüfen, ob es eine deutsche Aktie ist
  const isGermanStock = GERMAN_STOCKS.some(s => s.symbol === symbol || s.wkn === symbol);
  if (isGermanStock) {
    // Für deutsche Aktien .DE (Xetra) hinzufügen
    return `${symbol}.DE`;
  }

  // Für andere Vermögenswerte unverändert zurückgeben
  return symbol;
}

// Fallback-Preis für Vermögenswert abrufen
function getFallbackPrice(symbol: string): number | null {
  const asset = getAssetBySymbol(symbol);
  if (!asset) return null;
  return 'fallbackPrice' in asset ? (asset.fallbackPrice as number) : null;
}

export async function GET(
  req: Request,
  { params }: { params: { symbol: string } }
) {
  try {
    const originalSymbol = params?.symbol?.toUpperCase();

    if (!originalSymbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Конвертуємо символ для Yahoo Finance
    const yahooSymbol = convertToYahooSymbol(originalSymbol);
    
    console.log(`[SINGLE_PRICE] Fetching ${originalSymbol} as ${yahooSymbol}`);

    // Versuchen, echte Daten von Yahoo Finance API abzurufen
    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`,
        { 
          next: { revalidate: 60 }, // Für 60 Sekunden cachen
          headers: {
            'User-Agent': 'Mozilla/5.0',
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const result = data?.chart?.result?.[0];

        if (result && result.meta?.regularMarketPrice) {
          const currentPrice = result.meta.regularMarketPrice;
          const previousClose = result.meta.previousClose || currentPrice;
          const change = currentPrice - previousClose;
          const changePercent = previousClose > 0 ? ((change / previousClose) * 100) : 0;

          console.log(`[SINGLE_PRICE] ✅ ${originalSymbol}: ${currentPrice} ${result.meta.currency}`);

          return NextResponse.json({
            symbol: originalSymbol,
            price: parseFloat(currentPrice.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            currency: result.meta.currency || 'USD',
            timestamp: new Date().toISOString(),
            source: 'yahoo',
          });
        }
      }
    } catch (apiError) {
      console.error(`[SINGLE_PRICE_ERROR] ${originalSymbol}:`, apiError);
    }

    // Vermögenswerttyp bestimmen
    const isCrypto = CRYPTOCURRENCIES.some(c => c.symbol === originalSymbol);
    const fallbackPrice = getFallbackPrice(originalSymbol);
    
    // Wenn Yahoo Finance fehlgeschlagen ist
    // Für Kryptowährungen - Fallback-Preis verwenden
    if (isCrypto && fallbackPrice) {
      console.log(`[SINGLE_PRICE] 📊 Using fallback price for crypto ${originalSymbol}: ${fallbackPrice}`);
      
      return NextResponse.json({
        symbol: originalSymbol,
        price: fallbackPrice,
        change: 0,
        changePercent: 0,
        currency: 'USD',
        timestamp: new Date().toISOString(),
        source: 'fallback',
      });
    }
    
    // Für Aktien - "nach Marktpreis" zurückgeben
    if (!isCrypto) {
      console.log(`[SINGLE_PRICE] 📈 Market price for stock ${originalSymbol}`);
      
      return NextResponse.json({
        symbol: originalSymbol,
        price: 'market',
        change: 0,
        changePercent: 0,
        currency: 'EUR',
        timestamp: new Date().toISOString(),
        source: 'market_price',
      });
    }

    // Wenn nichts passt - Fehler zurückgeben
    console.error(`[SINGLE_PRICE] ❌ No price available for ${originalSymbol}`);
    
    return NextResponse.json(
      { 
        error: 'Preis konnte nicht abgerufen werden',
        symbol: originalSymbol 
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('[SINGLE_PRICE_ERROR]', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Preises' },
      { status: 500 }
    );
  }
}
