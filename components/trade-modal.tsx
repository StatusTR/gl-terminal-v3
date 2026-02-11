'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import { CRYPTOCURRENCIES, GERMAN_STOCKS } from '@/lib/assets';

interface TradeModalProps {
  mode: 'buy' | 'sell';
  onClose: () => void;
  onSuccess: () => void;
  initialSymbol?: string;
}

export default function TradeModal({ mode, onClose, onSuccess, initialSymbol }: TradeModalProps) {
  const [symbol, setSymbol] = useState(initialSymbol || '');
  const [assetType, setAssetType] = useState('STOCK');
  const [quantity, setQuantity] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [error, setError] = useState('');
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (mode === 'sell') {
      fetchPortfolio();
    }
  }, [mode]);

  const fetchPortfolio = async () => {
    try {
      const res = await fetch('/api/portfolio');
      const data = await res.json();
      if (data?.portfolio) {
        setPortfolio(data.portfolio);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  const fetchPrice = useCallback(async (sym: string) => {
    if (!sym) return;
    
    setLoadingPrice(true);
    setPrice(null);
    
    try {
      // Versuchen, aktuellen Preis von API abzurufen
      const res = await fetch(`/api/prices/${sym}`);
      const data = await res.json();
      
      let fetchedPrice = data?.price;
      
      // Prüfen, ob Preis gültig ist
      if (fetchedPrice === 'market') {
        // Für Aktien mit "Marktpreis" - Durchschnittspreis verwenden
        const portfolioItem = portfolio.find(p => p.symbol === sym);
        if (portfolioItem?.averageBuyPrice && portfolioItem.averageBuyPrice > 0) {
          console.log(`[PRICE_MARKET] Using average buy price for ${sym}: ${portfolioItem.averageBuyPrice}`);
          setPrice(portfolioItem.averageBuyPrice);
          setLoadingPrice(false);
          return;
        } else {
          // Wenn nicht im Portfolio - Fehler anzeigen
          console.error(`[PRICE_ERROR] Market price for ${sym}, not in portfolio`);
          setError('Preis nach Markt. Administrator wird Vermögenswert manuell hinzufügen.');
          setLoadingPrice(false);
          return;
        }
      }
      
      if (fetchedPrice && fetchedPrice > 0) {
        // Preis sieht korrekt aus - verwenden
        setPrice(fetchedPrice);
        setLoadingPrice(false);
        
        // Preisquelle zur Information anzeigen
        if (data?.source === 'fallback') {
          console.log(`[PRICE_INFO] Using fallback price for ${sym}: ${fetchedPrice}`);
        }
        return;
      }
      
      console.log(`[PRICE_WARNING] Invalid price ${fetchedPrice} for ${sym}`);
      
      // Fallback: Durchschnittspreis aus Portfolio verwenden (für Verkauf)
      if (mode === 'sell') {
        const portfolioItem = portfolio.find(p => p.symbol === sym);
        if (portfolioItem?.averageBuyPrice && portfolioItem.averageBuyPrice > 0) {
          console.log(`[PRICE_FALLBACK] Using average buy price: ${portfolioItem.averageBuyPrice}`);
          setPrice(portfolioItem.averageBuyPrice);
          setLoadingPrice(false);
          return;
        }
      }
      
      // Wenn alles andere fehlschlägt - Fehler anzeigen
      console.error(`[PRICE_ERROR] Could not get valid price for ${sym}`);
      setError('Aktueller Preis konnte nicht abgerufen werden. Bitte versuchen Sie es erneut.');
      setLoadingPrice(false);
      
    } catch (error) {
      console.error('[PRICE_FETCH_ERROR]', error);
      
      // Fallback für Verkauf
      if (mode === 'sell') {
        const portfolioItem = portfolio.find(p => p.symbol === sym);
        if (portfolioItem?.averageBuyPrice) {
          setPrice(portfolioItem.averageBuyPrice);
        } else {
          setError('Не вдалося отримати ціну активу');
        }
      }
      setLoadingPrice(false);
    }
  }, [mode, portfolio]);

  useEffect(() => {
    if (!symbol) {
      setPrice(null);
      return;
    }
    
    // Debounce: 300ms warten vor Preisabfrage
    const timer = setTimeout(() => {
      fetchPrice(symbol);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [symbol, fetchPrice]); // Memoizierte fetchPrice verwenden

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!symbol || !quantity || !price || !currency) {
      setError('Заповніть всі поля');
      setLoading(false);
      return;
    }

    try {
      const endpoint = mode === 'buy' ? '/api/portfolio/buy' : '/api/portfolio/sell';
      const payload =
        mode === 'buy'
          ? { symbol, assetType, quantity: parseFloat(quantity), price, currency }
          : { symbol, quantity: parseFloat(quantity), price, currency };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Fehler bei der Operation');
        setLoading(false);
        return;
      }

      onSuccess();
    } catch (err) {
      setError('Fehler сервера');
      setLoading(false);
    }
  };

  const getAvailableAssets = () => {
    if (assetType === 'CRYPTO') {
      return CRYPTOCURRENCIES?.filter?.(
        (crypto) =>
          crypto?.symbol?.toLowerCase?.()?.includes?.(searchTerm?.toLowerCase?.() ?? '') ||
          crypto?.name?.toLowerCase?.()?.includes?.(searchTerm?.toLowerCase?.() ?? '')
      ) ?? [];
    } else if (assetType === 'STOCK') {
      return GERMAN_STOCKS?.filter?.(
        (stock) =>
          stock?.symbol?.toLowerCase?.()?.includes?.(searchTerm?.toLowerCase?.() ?? '') ||
          stock?.wkn?.toLowerCase?.()?.includes?.(searchTerm?.toLowerCase?.() ?? '') ||
          stock?.name?.toLowerCase?.()?.includes?.(searchTerm?.toLowerCase?.() ?? '')
      ) ?? [];
    }
    return [];
  };

  const filteredAssets = getAvailableAssets();
  const totalAmount = quantity && price ? parseFloat(quantity) * price : 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'buy' ? (
              <>
                <TrendingUp className="w-5 h-5 text-green-600" />
                Vermögenswert kaufen
              </>
            ) : (
              <>
                <TrendingDown className="w-5 h-5 text-red-600" />
                Vermögenswert verkaufen
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'buy'
              ? 'Vermögenswert auswählen und Menge angeben'
              : 'Vermögenswert aus Ihrem Portfolio zum Verkauf auswählen'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {mode === 'buy' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="assetType">Vermögenswerttyp</Label>
                <Select value={assetType} onValueChange={(value) => {
                  setAssetType(value);
                  setSymbol('');
                  setSearchTerm('');
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STOCK">Aktien</SelectItem>
                    <SelectItem value="CRYPTO">Kryptowährung</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search">Vermögenswert suchen</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder={assetType === 'CRYPTO' ? 'Kryptowährung eingeben...' : 'WKN oder Aktienname eingeben...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {searchTerm && filteredAssets.length > 0 && (
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  {filteredAssets?.map?.((asset: any) => (
                    <button
                      key={asset?.symbol}
                      type="button"
                      onClick={() => {
                        setSymbol(asset?.symbol ?? '');
                        setSearchTerm('');
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{asset?.symbol}</div>
                          {asset?.wkn && <div className="text-xs text-gray-500">WKN: {asset?.wkn}</div>}
                          <div className="text-sm text-gray-600 mt-0.5">{asset?.name}</div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          assetType === 'CRYPTO' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {assetType}
                        </div>
                      </div>
                    </button>
                  )) ?? null}
                </div>
              )}

              {searchTerm && filteredAssets.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm border rounded-lg">
                  Keine Vermögenswerte gefunden
                </div>
              )}

              {symbol && !searchTerm && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">Ausgewählt: {symbol}</div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="symbol">Vermögenswert auswählen</Label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger>
                  <SelectValue placeholder="Vermögenswert auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {portfolio?.map?.((item) => (
                    <SelectItem key={item?.id} value={item?.symbol ?? ''}>
                      {item?.symbol} ({item?.quantity} Stück)
                    </SelectItem>
                  )) ?? null}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Menge</Label>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                min="0.001"
                placeholder="0.00"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Währung</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CHF">CHF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loadingPrice && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                Preis wird geladen...
              </div>
            </div>
          )}

          {!loadingPrice && price && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Aktueller Preis:</span>
                <span className="font-medium">
                  {currency} {price?.toFixed?.(2) ?? '0.00'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Gesamtsumme:</span>
                <span className="font-bold text-lg">
                  {currency} {totalAmount?.toFixed?.(2) ?? '0.00'}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={loading || loadingPrice || !symbol || !quantity || !price}
              className={`flex-1 ${
                mode === 'buy'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Verarbeitung...
                </div>
              ) : loadingPrice ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Preis wird geladen...
                </div>
              ) : mode === 'buy' ? (
                'Kaufen'
              ) : (
                'Verkaufen'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
