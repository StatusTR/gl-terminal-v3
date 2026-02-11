export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { CRYPTOCURRENCIES, GERMAN_STOCKS, getAssetBySymbol } from '@/lib/assets';

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
    // Für deutsche Aktien .DE (Xetra) hinzufügen або .SG (Stuttgart)
    // Verwenden .DE für bessere Liquidität
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

// Kostenlose API zum Abrufen echter Preise (keine API-Schlüssel erforderlich)
async function fetchRealPrice(originalSymbol: string): Promise<any> {
  try {
    // Конвертуємо символ для Yahoo Finance
    const yahooSymbol = convertToYahooSymbol(originalSymbol);
    
    console.log(`[PRICE] Fetching ${originalSymbol} as ${yahooSymbol}`);

    // Verwenden Yahoo Finance API (kostenlos, keine Registrierung)
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`,
      { 
        next: { revalidate: 60 }, // Für 60 Sekunden cachen
        headers: {
          'User-Agent': 'Mozilla/5.0',
        }
      }
    );

    if (!response.ok) {
      console.error(`[PRICE_ERROR] ${originalSymbol}: HTTP ${response.status}`);
      return { symbol: originalSymbol, price: null, error: 'Failed to fetch' };
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result || !result.meta?.regularMarketPrice) {
      console.error(`[PRICE_ERROR] ${originalSymbol}: No data in response`);
      
      // Для криптовалют використовуємо fallback ціну
      const isCrypto = CRYPTOCURRENCIES.some(c => c.symbol === originalSymbol);
      const fallbackPrice = getFallbackPrice(originalSymbol);
      
      if (isCrypto && fallbackPrice) {
        console.log(`[PRICE] 📊 Using fallback price for crypto ${originalSymbol}: ${fallbackPrice}`);
        return {
          symbol: originalSymbol,
          price: fallbackPrice,
          change: 0,
          changePercent: '0%',
          currency: 'USD',
          error: null,
          source: 'fallback',
        };
      }
      
      // Для акцій повертаємо "згідно ринкової"
      if (!isCrypto) {
        console.log(`[PRICE] 📈 Market price for stock ${originalSymbol}`);
        return {
          symbol: originalSymbol,
          price: 'market',
          change: 0,
          changePercent: '0%',
          currency: 'EUR',
          error: null,
          source: 'market_price',
        };
      }
      
      return { symbol: originalSymbol, price: null, error: 'No data available' };
    }

    const currentPrice = result.meta.regularMarketPrice;
    const previousClose = result.meta.previousClose || currentPrice;
    const change = currentPrice - previousClose;
    const changePercent = previousClose > 0 ? ((change / previousClose) * 100).toFixed(2) : 0;

    console.log(`[PRICE] ✅ ${originalSymbol}: ${currentPrice} ${result.meta.currency}`);

    return {
      symbol: originalSymbol, // Повертаємо оригінальний символ
      price: parseFloat(currentPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: `${changePercent}%`,
      currency: result.meta.currency || 'USD',
      error: null,
      source: 'yahoo',
    };
  } catch (error) {
    console.error(`[PRICE_ERROR] ${originalSymbol}:`, error);
    
    // Для криптовалют використовуємо fallback ціну при помилці
    const isCrypto = CRYPTOCURRENCIES.some(c => c.symbol === originalSymbol);
    const fallbackPrice = getFallbackPrice(originalSymbol);
    
    if (isCrypto && fallbackPrice) {
      console.log(`[PRICE] 📊 Using fallback price for crypto ${originalSymbol}: ${fallbackPrice}`);
      return {
        symbol: originalSymbol,
        price: fallbackPrice,
        change: 0,
        changePercent: '0%',
        currency: 'USD',
        error: null,
        source: 'fallback',
      };
    }
    
    // Для акцій повертаємо "згідно ринкової"
    if (!isCrypto) {
      console.log(`[PRICE] 📈 Market price for stock ${originalSymbol}`);
      return {
        symbol: originalSymbol,
        price: 'market',
        change: 0,
        changePercent: '0%',
        currency: 'EUR',
        error: null,
        source: 'market_price',
      };
    }
    
    return { symbol: originalSymbol, price: null, error: 'Error fetching price' };
  }
}

// Batch API для отримання цін кількох активів одночасно
export async function POST(request: NextRequest) {
  try {
    const { symbols } = await request.json();

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { error: 'Symbols array is required' },
        { status: 400 }
      );
    }

    console.log('[BATCH_PRICES] Fetching real prices for:', symbols);

    // Обмежуємо кількість символів для уникнення перевантаження
    const limitedSymbols = symbols.slice(0, 20);

    // Fetch prices з затримкою між запитами для уникнення rate limiting
    const pricesPromises = limitedSymbols.map(async (symbol: string, index: number) => {
      // Додаємо невелику затримку між запитами (50ms)
      await new Promise(resolve => setTimeout(resolve, index * 50));
      return await fetchRealPrice(symbol);
    });

    const results = await Promise.all(pricesPromises);

    // Повертаємо як об'єкт для швидкого доступу
    const pricesMap = results.reduce((acc, item) => {
      acc[item.symbol] = item;
      return acc;
    }, {} as Record<string, any>);

    const successCount = results.filter(r => r.price !== null).length;
    console.log(`[BATCH_PRICES] ✅ Successfully fetched ${successCount}/${limitedSymbols.length} prices`);

    return NextResponse.json({ prices: pricesMap });
  } catch (error) {
    console.error('[BATCH_PRICES_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    );
  }
}
