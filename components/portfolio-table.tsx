'use client';

import { useEffect, useState, useMemo, memo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Briefcase, Minus, Filter, Bitcoin, TrendingUpIcon, Plus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface PortfolioItem {
  id: string;
  symbol: string;
  assetType: string;
  quantity: number;
  averageBuyPrice: number;
  currency: string;
}

interface PortfolioTableProps {
  onSell?: (symbol: string) => void;
  onBuy?: () => void;
  onSellClick?: () => void;
}

function PortfolioTable({ onSell, onBuy, onSellClick }: PortfolioTableProps) {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const res = await fetch('/api/portfolio');
      const data = await res.json();
      if (data?.portfolio) {
        setPortfolio(data.portfolio);
        
        // Alle Preise mit einem Batch-Request abrufen
        if (data.portfolio.length > 0) {
          const symbols = data.portfolio.map((item: PortfolioItem) => item.symbol);
          await fetchPricesBatch(symbols);
        }
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPricesBatch = async (symbols: string[]) => {
    try {
      const res = await fetch('/api/prices/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols }),
      });
      const data = await res.json();
      if (data?.prices) {
        setPrices(data.prices);
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  const calculateProfitLoss = (item: PortfolioItem) => {
    const currentPrice = prices?.[item?.symbol]?.price ?? item?.averageBuyPrice ?? 0;
    const invested = (item?.quantity ?? 0) * (item?.averageBuyPrice ?? 0);
    const current = (item?.quantity ?? 0) * currentPrice;
    const profitLoss = current - invested;
    const profitLossPercent = invested > 0 ? (profitLoss / invested) * 100 : 0;
    return { profitLoss, profitLossPercent, currentPrice, current };
  };

  // Gefiltertes Portfolio memoizieren
  const filteredPortfolio = useMemo(() => {
    return portfolio?.filter?.((item) => {
      if (activeTab === 'ALL') return true;
      return item?.assetType === activeTab;
    }) ?? [];
  }, [portfolio, activeTab]);

  // Anzahl der Vermögenswerte memoizieren
  const { cryptoCount, stockCount } = useMemo(() => {
    return {
      cryptoCount: portfolio?.filter?.(item => item?.assetType === 'CRYPTO')?.length ?? 0,
      stockCount: portfolio?.filter?.(item => item?.assetType === 'STOCK')?.length ?? 0,
    };
  }, [portfolio]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Mein Portfolio
            </CardTitle>
            <div className="flex items-center gap-2">
              {onBuy && (
                <Button
                  size="sm"
                  onClick={onBuy}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Kaufen
                </Button>
              )}
              {onSellClick && (
                <Button
                  size="sm"
                  onClick={onSellClick}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Minus className="w-4 h-4 mr-1" />
                  Verkaufen
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!portfolio || portfolio?.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Mein Portfolio
            </CardTitle>
            <div className="flex items-center gap-2">
              {onBuy && (
                <Button
                  size="sm"
                  onClick={onBuy}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Kaufen
                </Button>
              )}
              {onSellClick && (
                <Button
                  size="sm"
                  onClick={onSellClick}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Minus className="w-4 h-4 mr-1" />
                  Verkaufen
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Ihr Portfolio ist leer</p>
            <p className="text-sm mt-1">Beginnen Sie mit dem Handel, um Ihre Vermögenswerte zu sehen</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderPortfolioTable = (items: PortfolioItem[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Keine Vermögenswerte dieses Typs</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vermögenswert</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead className="text-right">Menge</TableHead>
              <TableHead className="text-right">Durchschn. Preis</TableHead>
              <TableHead className="text-right">Aktueller Preis</TableHead>
              <TableHead className="text-right">Wert</TableHead>
              <TableHead className="text-right">Gewinn/Verlust</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items?.map?.((item) => {
              const { profitLoss, profitLossPercent, currentPrice, current } =
                calculateProfitLoss(item);
              const isProfit = profitLoss >= 0;

              return (
                <TableRow key={item?.id}>
                  <TableCell className="font-medium">{item?.symbol}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item?.assetType === 'CRYPTO' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                      {item?.assetType}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {item?.quantity?.toFixed?.(2) ?? '0.00'}
                  </TableCell>
                  <TableCell className="text-right">
                    {item?.currency} {item?.averageBuyPrice?.toFixed?.(2) ?? '0.00'}
                  </TableCell>
                  <TableCell className="text-right">
                    {item?.currency} {currentPrice?.toFixed?.(2) ?? '0.00'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {item?.currency} {current?.toFixed?.(2) ?? '0.00'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className={`flex items-center justify-end gap-1 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                      {isProfit ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="font-medium">
                        {profitLoss?.toFixed?.(2) ?? '0.00'}
                      </span>
                      <span className="text-xs">({profitLossPercent?.toFixed?.(1) ?? '0.0'}%)</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSell?.(item?.symbol)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            }) ?? null}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Mein Portfolio
          </CardTitle>
          <div className="flex items-center gap-2">
            {onBuy && (
              <Button
                size="sm"
                onClick={onBuy}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                <Plus className="w-4 h-4 mr-1" />
                Kaufen
              </Button>
            )}
            {onSellClick && (
              <Button
                size="sm"
                onClick={onSellClick}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Minus className="w-4 h-4 mr-1" />
                Verkaufen
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="ALL" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Alle ({portfolio?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="STOCK" className="flex items-center gap-2">
              <TrendingUpIcon className="w-4 h-4" />
              Aktien ({stockCount})
            </TabsTrigger>
            <TabsTrigger value="CRYPTO" className="flex items-center gap-2">
              <Bitcoin className="w-4 h-4" />
              Kryptowährungen ({cryptoCount})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="ALL">
            {renderPortfolioTable(filteredPortfolio)}
          </TabsContent>
          
          <TabsContent value="STOCK">
            {renderPortfolioTable(filteredPortfolio)}
          </TabsContent>
          
          <TabsContent value="CRYPTO">
            {renderPortfolioTable(filteredPortfolio)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default memo(PortfolioTable);
