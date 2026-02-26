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
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
              Mein Portfolio
            </CardTitle>
            <div className="flex items-center gap-2">
              {onBuy && (
                <Button
                  size="sm"
                  onClick={onBuy}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs sm:text-sm"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Kaufen
                </Button>
              )}
              {onSellClick && (
                <Button
                  size="sm"
                  onClick={onSellClick}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50 text-xs sm:text-sm"
                >
                  <Minus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Verkaufen
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="h-5 w-5 sm:h-6 sm:w-6 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!portfolio || portfolio?.length === 0) {
    return (
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
              Mein Portfolio
            </CardTitle>
            <div className="flex items-center gap-2">
              {onBuy && (
                <Button
                  size="sm"
                  onClick={onBuy}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs sm:text-sm"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Kaufen
                </Button>
              )}
              {onSellClick && (
                <Button
                  size="sm"
                  onClick={onSellClick}
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50 text-xs sm:text-sm"
                >
                  <Minus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Verkaufen
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="text-center py-8 sm:py-12 text-gray-500">
            <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm sm:text-base">Ihr Portfolio ist leer</p>
            <p className="text-xs sm:text-sm mt-1">Beginnen Sie mit dem Handel, um Ihre Vermögenswerte zu sehen</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderPortfolioTable = (items: PortfolioItem[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 sm:py-12 text-gray-500">
          <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm sm:text-base">Keine Vermögenswerte dieses Typs</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap">Vermögenswert</TableHead>
                <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">Typ</TableHead>
                <TableHead className="text-xs sm:text-sm text-right whitespace-nowrap">Menge</TableHead>
                <TableHead className="text-xs sm:text-sm text-right whitespace-nowrap hidden md:table-cell">Durchschn.</TableHead>
                <TableHead className="text-xs sm:text-sm text-right whitespace-nowrap hidden lg:table-cell">Aktuell</TableHead>
                <TableHead className="text-xs sm:text-sm text-right whitespace-nowrap">Wert</TableHead>
                <TableHead className="text-xs sm:text-sm text-right whitespace-nowrap">+/-</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map?.((item) => {
                const { profitLoss, profitLossPercent, currentPrice, current } =
                  calculateProfitLoss(item);
                const isProfit = profitLoss >= 0;

                return (
                  <TableRow key={item?.id}>
                    <TableCell className="font-medium text-xs sm:text-sm py-2 sm:py-4">
                      <div>
                        <span>{item?.symbol}</span>
                        <span className="sm:hidden block text-[10px] text-gray-500">{item?.assetType}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell py-2 sm:py-4">
                      <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${item?.assetType === 'CRYPTO' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                        {item?.assetType}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4">
                      {item?.quantity?.toFixed?.(2) ?? '0.00'}
                    </TableCell>
                    <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4 hidden md:table-cell">
                      {item?.currency} {item?.averageBuyPrice?.toFixed?.(2) ?? '0.00'}
                    </TableCell>
                    <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4 hidden lg:table-cell">
                      {item?.currency} {currentPrice?.toFixed?.(2) ?? '0.00'}
                    </TableCell>
                    <TableCell className="text-right font-medium text-xs sm:text-sm py-2 sm:py-4">
                      <span className="hidden sm:inline">{item?.currency}</span> {current?.toFixed?.(2) ?? '0.00'}
                    </TableCell>
                    <TableCell className="text-right py-2 sm:py-4">
                      <div className={`flex items-center justify-end gap-0.5 sm:gap-1 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {isProfit ? (
                          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : (
                          <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                        <span className="font-medium text-xs sm:text-sm">
                          <span className="hidden sm:inline">{profitLoss?.toFixed?.(2) ?? '0.00'}</span>
                          <span className="sm:hidden">{profitLossPercent?.toFixed?.(0) ?? '0'}%</span>
                        </span>
                        <span className="text-[10px] sm:text-xs hidden sm:inline">({profitLossPercent?.toFixed?.(1) ?? '0.0'}%)</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 sm:py-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSell?.(item?.symbol)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 sm:p-2 h-auto"
                      >
                        <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              }) ?? null}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
            Mein Portfolio
          </CardTitle>
          <div className="flex items-center gap-2">
            {onBuy && (
              <Button
                size="sm"
                onClick={onBuy}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs sm:text-sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Kaufen
              </Button>
            )}
            {onSellClick && (
              <Button
                size="sm"
                onClick={onSellClick}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50 text-xs sm:text-sm"
              >
                <Minus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Verkaufen
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 h-auto p-1">
            <TabsTrigger value="ALL" className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm py-1.5 sm:py-2 px-1 sm:px-3">
              <Filter className="w-3 h-3 sm:w-4 sm:h-4 hidden xs:block" />
              <span>Alle</span>
              <span className="hidden sm:inline">({portfolio?.length ?? 0})</span>
            </TabsTrigger>
            <TabsTrigger value="STOCK" className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm py-1.5 sm:py-2 px-1 sm:px-3">
              <TrendingUpIcon className="w-3 h-3 sm:w-4 sm:h-4 hidden xs:block" />
              <span>Aktien</span>
              <span className="hidden sm:inline">({stockCount})</span>
            </TabsTrigger>
            <TabsTrigger value="CRYPTO" className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm py-1.5 sm:py-2 px-1 sm:px-3">
              <Bitcoin className="w-3 h-3 sm:w-4 sm:h-4 hidden xs:block" />
              <span>Crypto</span>
              <span className="hidden sm:inline">({cryptoCount})</span>
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
